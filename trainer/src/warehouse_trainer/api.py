from __future__ import annotations

import os
import threading
import uuid
from typing import Literal

import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, model_validator

from warehouse_trainer.client import HttpWarehouseClient
from warehouse_trainer.config import TrainerConfig
from warehouse_trainer.gym_env import WarehouseGymEnv
from warehouse_trainer.main import run_ppo, run_random


class Position(BaseModel):
    x: int = Field(ge=0)
    y: int = Field(ge=0)


class TrainingRequest(BaseModel):
    mode: Literal["random", "ppo"] = "ppo"
    width: int = Field(default=4, ge=2, le=30)
    height: int = Field(default=4, ge=2, le=30)
    max_steps: int = Field(default=10, ge=1, le=10_000)
    robot_start: Position = Position(x=0, y=0)
    box_start: Position = Position(x=1, y=1)
    goal_position: Position = Position(x=3, y=3)
    random_episodes: int = Field(default=20, ge=1, le=100_000)
    random_seed: int | None = 42
    ppo_total_timesteps: int = Field(default=10_000, ge=64, le=10_000_000)
    ppo_learning_rate: float = Field(default=0.0003, gt=0, le=1)
    ppo_n_steps: int = Field(default=64, ge=2, le=4096)
    ppo_batch_size: int = Field(default=32, ge=2, le=4096)
    ppo_gamma: float = Field(default=0.99, gt=0, le=1)
    ppo_eval_episodes: int = Field(default=3, ge=1, le=1000)

    @model_validator(mode="after")
    def validate_positions(self) -> "TrainingRequest":
        for name, position in (
            ("robot_start", self.robot_start),
            ("box_start", self.box_start),
            ("goal_position", self.goal_position),
        ):
            if position.x >= self.width or position.y >= self.height:
                raise ValueError(f"{name} must be inside the selected grid")
        if self.ppo_batch_size > self.ppo_n_steps:
            raise ValueError("PPO batch size cannot exceed rollout steps")
        return self


app = FastAPI(title="Warehouse RL Trainer")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_lock = threading.Lock()
_status: dict[str, object] = {"state": "idle"}


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "trainer"}


@app.get("/training/status")
def training_status() -> dict[str, object]:
    with _lock:
        return dict(_status)


@app.post("/training/start", status_code=202)
def start_training(request: TrainingRequest) -> dict[str, object]:
    with _lock:
        if _status.get("state") == "running":
            raise HTTPException(status_code=409, detail="A training run is already active")
        run_id = str(uuid.uuid4())
        _status.clear()
        _status.update({
            "id": run_id,
            "state": "running",
            "phase": "training",
            "mode": request.mode,
            "evaluation_episodes": request.ppo_eval_episodes if request.mode == "ppo" else 0,
        })

    try:
        _configure_environment(request)
    except Exception as error:
        with _lock:
            _status.update({"id": run_id, "state": "failed", "error": str(error)})
        raise HTTPException(status_code=400, detail=f"Could not configure warehouse: {error}") from error

    threading.Thread(target=_run_training, args=(run_id, request), daemon=True).start()
    return dict(_status)


def _configure_environment(request: TrainingRequest) -> None:
    environment_url = os.getenv("ENVIRONMENT_BASE_URL", "http://environment:3001")
    response = requests.post(
        f"{environment_url}/configure",
        json={
            "width": request.width,
            "height": request.height,
            "maxSteps": request.max_steps,
            "robotStart": request.robot_start.model_dump(),
            "boxStart": request.box_start.model_dump(),
            "goalPosition": request.goal_position.model_dump(),
            "walls": [],
        },
        timeout=10,
    )
    response.raise_for_status()


def _run_training(run_id: str, request: TrainingRequest) -> None:
    environment_url = os.getenv("ENVIRONMENT_BASE_URL", "http://environment:3001")
    try:
        config = TrainerConfig(
            environment_base_url=environment_url,
            request_timeout_seconds=10,
            trainer_mode=request.mode,
            random_agent_episodes=request.random_episodes,
            random_agent_seed=request.random_seed,
            ppo_total_timesteps=request.ppo_total_timesteps,
            ppo_learning_rate=request.ppo_learning_rate,
            ppo_n_steps=request.ppo_n_steps,
            ppo_batch_size=request.ppo_batch_size,
            ppo_gamma=request.ppo_gamma,
            ppo_model_path=os.getenv("PPO_MODEL_PATH", "/app/models/warehouse_ppo.zip"),
            ppo_eval_episodes=request.ppo_eval_episodes,
        )
        env = WarehouseGymEnv(HttpWarehouseClient(environment_url, 10))
        if request.mode == "ppo":
            summary = run_ppo(
                env,
                config,
                lambda: _set_evaluating(run_id, request.ppo_eval_episodes),
            )
            result = {
                "evaluation_episodes": summary.eval_episodes,
                "successful_deliveries": summary.successful_deliveries,
                "success_rate": summary.success_rate,
                "mean_reward": summary.mean_reward,
                "mean_steps": summary.mean_steps,
                "model_path": summary.model_path,
            }
        else:
            summaries = run_random(env, config)
            successful = sum(item.final_reason == "delivered_box" for item in summaries)
            result = {
                "evaluation_episodes": len(summaries),
                "successful_deliveries": successful,
                "success_rate": successful / len(summaries),
                "mean_reward": sum(item.total_reward for item in summaries) / len(summaries),
                "mean_steps": sum(item.steps for item in summaries) / len(summaries),
            }
        with _lock:
            _status.update({"id": run_id, "state": "completed", "phase": "completed", "result": result})
    except Exception as error:
        with _lock:
            _status.update({"id": run_id, "state": "failed", "error": str(error)})


def _set_evaluating(run_id: str, episodes: int) -> None:
    with _lock:
        if _status.get("id") == run_id:
            _status.update({"phase": "evaluating", "evaluation_episodes": episodes})
