import os
from dataclasses import dataclass
from typing import Literal

TrainerMode = Literal["random", "ppo"]


@dataclass(frozen=True)
class TrainerConfig:
    environment_base_url: str
    request_timeout_seconds: float
    trainer_mode: TrainerMode
    random_agent_episodes: int
    random_agent_seed: int | None
    ppo_total_timesteps: int
    ppo_learning_rate: float
    ppo_n_steps: int
    ppo_batch_size: int
    ppo_gamma: float
    ppo_model_path: str
    ppo_eval_episodes: int


def _optional_int(value: str | None) -> int | None:
    if value is None or value == "":
        return None

    return int(value)


def _trainer_mode(value: str | None) -> TrainerMode:
    if value in (None, "", "random"):
        return "random"

    if value == "ppo":
        return "ppo"

    raise ValueError(f"Unsupported TRAINER_MODE: {value}")


def load_config() -> TrainerConfig:
    return TrainerConfig(
        environment_base_url=os.getenv("ENVIRONMENT_BASE_URL", "http://environment:3001"),
        request_timeout_seconds=float(os.getenv("TRAINER_REQUEST_TIMEOUT_SECONDS", "5")),
        trainer_mode=_trainer_mode(os.getenv("TRAINER_MODE")),
        random_agent_episodes=int(os.getenv("RANDOM_AGENT_EPISODES", "5")),
        random_agent_seed=_optional_int(os.getenv("RANDOM_AGENT_SEED")),
        ppo_total_timesteps=int(os.getenv("PPO_TOTAL_TIMESTEPS", "2000")),
        ppo_learning_rate=float(os.getenv("PPO_LEARNING_RATE", "0.0003")),
        ppo_n_steps=int(os.getenv("PPO_N_STEPS", "64")),
        ppo_batch_size=int(os.getenv("PPO_BATCH_SIZE", "32")),
        ppo_gamma=float(os.getenv("PPO_GAMMA", "0.99")),
        ppo_model_path=os.getenv("PPO_MODEL_PATH", "/app/models/warehouse_ppo.zip"),
        ppo_eval_episodes=int(os.getenv("PPO_EVAL_EPISODES", "3")),
    )
