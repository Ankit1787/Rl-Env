import numpy as np
import pytest

from warehouse_trainer.actions import action_name
from warehouse_trainer.gym_env import WarehouseGymEnv
from warehouse_trainer.models import StepResult, WarehouseState


def make_state(
    *,
    robot_x: int = 0,
    robot_y: int = 0,
    box_x: int = 1,
    box_y: int = 0,
    carrying: bool = False,
    delivered: bool = False,
    done: bool = False,
    step_count: int = 0,
    last_reward: float = 0.0,
    terminal_reason: str | None = None,
) -> WarehouseState:
    state: WarehouseState = {
        "episode": 1,
        "stepCount": step_count,
        "maxSteps": 20,
        "done": done,
        "robot": {
            "position": {"x": robot_x, "y": robot_y},
            "carryingBox": carrying,
        },
        "box": {
            "position": {"x": box_x, "y": box_y},
            "isDelivered": delivered,
        },
        "goal": {"x": 3, "y": 0},
        "walls": [],
        "width": 4,
        "height": 4,
        "lastReward": last_reward,
    }
    if terminal_reason is not None:
        state["terminalReason"] = terminal_reason
    return state


class FakeWarehouseClient:
    def __init__(self) -> None:
        self.actions: list[str] = []
        self.current_state = make_state()

    def state(self) -> WarehouseState:
        return self.current_state

    def reset(self) -> WarehouseState:
        self.current_state = make_state()
        return self.current_state

    def step(self, action: str) -> StepResult:
        self.actions.append(action)
        self.current_state = make_state(robot_x=1, step_count=1, last_reward=-1)
        return {
            "state": self.current_state,
            "reward": -1,
            "done": False,
            "info": {
                "reason": "moved",
                "valid": True,
            },
        }


class TerminalWarehouseClient(FakeWarehouseClient):
    def step(self, action: str) -> StepResult:
        self.actions.append(action)
        self.current_state = make_state(
            robot_x=3,
            box_x=3,
            delivered=True,
            done=True,
            step_count=5,
            last_reward=50,
            terminal_reason="delivered_box",
        )
        return {
            "state": self.current_state,
            "reward": 50,
            "done": True,
            "info": {
                "reason": "delivered_box",
                "valid": True,
            },
        }


class TruncatedWarehouseClient(FakeWarehouseClient):
    def step(self, action: str) -> StepResult:
        self.actions.append(action)
        self.current_state = make_state(
            done=True,
            step_count=20,
            last_reward=-5,
            terminal_reason="max_steps_reached",
        )
        return {
            "state": self.current_state,
            "reward": -5,
            "done": True,
            "info": {
                "reason": "max_steps_reached",
                "valid": True,
            },
        }


def test_action_name_maps_discrete_indices_to_environment_actions() -> None:
    assert action_name(0) == "move_up"
    assert action_name(5) == "drop"

    with pytest.raises(ValueError):
        action_name(6)

    with pytest.raises(ValueError):
        action_name(-1)


def test_reset_returns_normalized_observation_and_info() -> None:
    env = WarehouseGymEnv(FakeWarehouseClient())

    observation, info = env.reset()

    assert observation.shape == (19,)
    assert observation.dtype == np.float32
    assert np.all(observation >= 0)
    assert np.all(observation <= 1)
    assert info["env_episode"] == 1
    assert info["step_count"] == 0
    assert observation[11:15].tolist() == [1.0, 0.0, 1.0, 0.0]
    assert observation[15:19].tolist() == [0.0, 0.0, 0.0, 0.0]


def test_action_mask_allows_only_valid_actions() -> None:
    client = FakeWarehouseClient()
    env = WarehouseGymEnv(client)

    assert env.action_masks().tolist() == [False, True, False, True, False, False]

    client.current_state = make_state(robot_x=1, box_x=1)
    env._state = client.current_state
    assert env.action_masks().tolist() == [False, False, False, False, True, False]

    client.current_state = make_state(robot_x=3, box_x=3, carrying=True)
    env._state = client.current_state
    assert env.action_masks().tolist() == [False, False, False, False, False, True]


def test_step_sends_discrete_action_to_client() -> None:
    client = FakeWarehouseClient()
    env = WarehouseGymEnv(client)

    observation, reward, terminated, truncated, info = env.step(3)

    assert client.actions == ["move_right"]
    assert observation[0] == pytest.approx(1 / 3)
    assert reward == -1
    assert terminated is False
    assert truncated is False
    assert info["reason"] == "moved"
    assert info["valid"] is True


def test_delivery_result_is_terminal_not_truncated() -> None:
    env = WarehouseGymEnv(TerminalWarehouseClient())

    _, reward, terminated, truncated, info = env.step(5)

    assert reward == 50
    assert terminated is True
    assert truncated is False
    assert info["terminal_reason"] == "delivered_box"


def test_max_steps_result_is_truncated() -> None:
    env = WarehouseGymEnv(TruncatedWarehouseClient())

    _, reward, terminated, truncated, info = env.step(0)

    assert reward == -5
    assert terminated is False
    assert truncated is True
    assert info["terminal_reason"] == "max_steps_reached"
