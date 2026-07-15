import pytest

from warehouse_trainer.random_agent import RandomAgentRunner


class FakeActionSpace:
    def __init__(self) -> None:
        self.seed_values: list[int | None] = []
        self.sampled_actions: list[int] = []

    def seed(self, seed: int | None = None) -> None:
        self.seed_values.append(seed)

    def sample(self) -> int:
        self.sampled_actions.append(3)
        return 3


class FakeEnv:
    def __init__(self, terminate_after_steps: int = 3) -> None:
        self.action_space = FakeActionSpace()
        self.terminate_after_steps = terminate_after_steps
        self.reset_seeds: list[int | None] = []
        self.current_steps = 0

    def reset(self, *, seed: int | None = None, options: dict | None = None):
        self.reset_seeds.append(seed)
        self.current_steps = 0
        return [0.0], {"episode": len(self.reset_seeds)}

    def step(self, action: int):
        self.current_steps += 1
        terminated = self.current_steps >= self.terminate_after_steps
        return (
            [0.0],
            -1.0,
            terminated,
            False,
            {"reason": "delivered_box" if terminated else "moved"},
        )


class TruncatingFakeEnv(FakeEnv):
    def step(self, action: int):
        self.current_steps += 1
        truncated = self.current_steps >= self.terminate_after_steps
        return (
            [0.0],
            -5.0,
            False,
            truncated,
            {"reason": "max_steps_reached" if truncated else "moved"},
        )


def test_random_agent_runs_configured_episode_count() -> None:
    env = FakeEnv(terminate_after_steps=2)
    runner = RandomAgentRunner(env=env, episodes=2, seed=10)

    summaries = runner.run()

    assert env.action_space.seed_values == [10]
    assert env.reset_seeds == [10, 11]
    assert len(summaries) == 2
    assert summaries[0].steps == 2
    assert summaries[0].total_reward == -2.0
    assert summaries[0].terminated is True
    assert summaries[0].truncated is False
    assert summaries[0].final_reason == "delivered_box"


def test_random_agent_records_truncated_episodes() -> None:
    env = TruncatingFakeEnv(terminate_after_steps=1)
    runner = RandomAgentRunner(env=env, episodes=1)

    summaries = runner.run()

    assert summaries[0].steps == 1
    assert summaries[0].total_reward == -5.0
    assert summaries[0].terminated is False
    assert summaries[0].truncated is True
    assert summaries[0].final_reason == "max_steps_reached"


def test_random_agent_rejects_non_positive_episode_count() -> None:
    with pytest.raises(ValueError, match="episodes must be greater than 0"):
        RandomAgentRunner(env=FakeEnv(), episodes=0)
