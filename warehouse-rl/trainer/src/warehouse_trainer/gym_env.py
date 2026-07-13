import gymnasium as gym
import numpy as np
from gymnasium import spaces

from warehouse_trainer.actions import ACTION_NAMES, action_name
from warehouse_trainer.models import WarehouseApiClient, WarehouseState


class WarehouseGymEnv(gym.Env):
    metadata = {"render_modes": ["ansi"]}

    def __init__(self, client: WarehouseApiClient) -> None:
        super().__init__()
        self._client = client
        self._state = client.state()
        self.action_space = spaces.Discrete(len(ACTION_NAMES))
        self.observation_space = spaces.Box(
            low=0.0,
            high=1.0,
            shape=(11,),
            dtype=np.float32,
        )

    def reset(self, *, seed: int | None = None, options: dict | None = None):
        super().reset(seed=seed)
        self._state = self._client.reset()
        return self._observation_from_state(self._state), self._info_from_state(self._state)

    def step(self, action: int):
        result = self._client.step(action_name(int(action)))
        self._state = result["state"]
        terminated = bool(result["done"])
        truncated = bool(
            self._state.get("terminalReason") == "max_steps_reached"
            and result["info"]["reason"] == "max_steps_reached"
        )
        return (
            self._observation_from_state(self._state),
            float(result["reward"]),
            terminated and not truncated,
            truncated,
            {
                **self._info_from_state(self._state),
                "reason": result["info"]["reason"],
                "valid": result["info"]["valid"],
            },
        )

    def render(self):
        robot = self._state["robot"]["position"]
        box = self._state["box"]["position"]
        goal = self._state["goal"]
        return (
            f"robot=({robot['x']},{robot['y']}) "
            f"box=({box['x']},{box['y']}) "
            f"goal=({goal['x']},{goal['y']}) "
            f"carrying={self._state['robot']['carryingBox']}"
        )

    def _observation_from_state(self, state: WarehouseState) -> np.ndarray:
        width = max(float(state["width"] - 1), 1.0)
        height = max(float(state["height"] - 1), 1.0)
        max_steps = max(float(state["maxSteps"]), 1.0)
        robot = state["robot"]
        box = state["box"]
        goal = state["goal"]

        positive_reward_scaled = np.clip(max(float(state["lastReward"]), 0.0) / 100.0, 0.0, 1.0)

        return np.array(
            [
                robot["position"]["x"] / width,
                robot["position"]["y"] / height,
                box["position"]["x"] / width,
                box["position"]["y"] / height,
                goal["x"] / width,
                goal["y"] / height,
                float(robot["carryingBox"]),
                float(box["isDelivered"]),
                state["stepCount"] / max_steps,
                float(state["done"]),
                positive_reward_scaled,
            ],
            dtype=np.float32,
        )

    def _info_from_state(self, state: WarehouseState) -> dict[str, object]:
        return {
            "env_episode": state["episode"],
            "step_count": state["stepCount"],
            "last_action": state.get("lastAction"),
            "terminal_reason": state.get("terminalReason"),
        }
