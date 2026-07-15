from dataclasses import dataclass
from typing import Protocol


class ActionSpace(Protocol):
    def seed(self, seed: int | None = None) -> None:
        ...

    def sample(self) -> int:
        ...


class GymLikeEnvironment(Protocol):
    action_space: ActionSpace

    def reset(self, *, seed: int | None = None, options: dict | None = None):
        ...

    def step(self, action: int):
        ...

    def action_masks(self):
        ...


@dataclass(frozen=True)
class EpisodeSummary:
    episode: int
    steps: int
    total_reward: float
    terminated: bool
    truncated: bool
    final_reason: str | None


class RandomAgentRunner:
    def __init__(self, env: GymLikeEnvironment, episodes: int, seed: int | None = None) -> None:
        if episodes < 1:
            raise ValueError("episodes must be greater than 0")

        self._env = env
        self._episodes = episodes
        self._seed = seed

    def run(self) -> list[EpisodeSummary]:
        self._env.action_space.seed(self._seed)
        summaries: list[EpisodeSummary] = []

        for episode_index in range(self._episodes):
            episode_seed = None if self._seed is None else self._seed + episode_index
            _, _ = self._env.reset(seed=episode_seed)
            terminated = False
            truncated = False
            total_reward = 0.0
            steps = 0
            final_reason: str | None = None

            while not terminated and not truncated:
                action = int(self._env.action_space.sample())
                _, reward, terminated, truncated, info = self._env.step(action)
                total_reward += float(reward)
                steps += 1
                final_reason = _extract_reason(info)

            summaries.append(
                EpisodeSummary(
                    episode=episode_index + 1,
                    steps=steps,
                    total_reward=total_reward,
                    terminated=terminated,
                    truncated=truncated,
                    final_reason=final_reason,
                )
            )

        return summaries


def _extract_reason(info: object) -> str | None:
    if isinstance(info, dict):
        reason = info.get("reason") or info.get("terminal_reason")
        if isinstance(reason, str):
            return reason

    return None
