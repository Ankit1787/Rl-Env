from dataclasses import dataclass
from pathlib import Path
from typing import Any, Callable, Protocol

from warehouse_trainer.random_agent import GymLikeEnvironment


class PpoModel(Protocol):
    def learn(self, total_timesteps: int):
        ...

    def predict(
        self,
        observation: object,
        deterministic: bool = True,
        action_masks: object | None = None,
    ):
        ...

    def save(self, path: str) -> None:
        ...


class PpoFactory(Protocol):
    def __call__(self, policy: str, env: GymLikeEnvironment, **kwargs: Any) -> PpoModel:
        ...


@dataclass(frozen=True)
class PpoTrainingConfig:
    total_timesteps: int
    learning_rate: float
    n_steps: int
    batch_size: int
    gamma: float
    model_path: str
    eval_episodes: int


@dataclass(frozen=True)
class PpoTrainingSummary:
    model_path: str
    total_timesteps: int
    eval_episodes: int
    mean_reward: float
    successful_deliveries: int
    success_rate: float
    mean_steps: float


class PpoTrainer:
    def __init__(
        self,
        env: GymLikeEnvironment,
        config: PpoTrainingConfig,
        ppo_factory: PpoFactory | None = None,
        on_evaluation_start: Callable[[], None] | None = None,
    ) -> None:
        self._env = env
        self._config = config
        self._ppo_factory = ppo_factory
        self._on_evaluation_start = on_evaluation_start

    def train(self) -> PpoTrainingSummary:
        model = self._create_model()
        model.learn(total_timesteps=self._config.total_timesteps)
        self._save_model(model)
        if self._on_evaluation_start is not None:
            self._on_evaluation_start()
        mean_reward, successful_deliveries, mean_steps = self._evaluate(model)

        return PpoTrainingSummary(
            model_path=self._config.model_path,
            total_timesteps=self._config.total_timesteps,
            eval_episodes=self._config.eval_episodes,
            mean_reward=mean_reward,
            successful_deliveries=successful_deliveries,
            success_rate=successful_deliveries / self._config.eval_episodes,
            mean_steps=mean_steps,
        )

    def _create_model(self) -> PpoModel:
        ppo_factory = self._ppo_factory or _stable_baselines_ppo
        return ppo_factory(
            "MlpPolicy",
            self._env,
            learning_rate=self._config.learning_rate,
            n_steps=self._config.n_steps,
            batch_size=self._config.batch_size,
            gamma=self._config.gamma,
            verbose=1,
        )

    def _save_model(self, model: PpoModel) -> None:
        model_path = Path(self._config.model_path)
        model_path.parent.mkdir(parents=True, exist_ok=True)
        model.save(str(model_path))

    def _evaluate(self, model: PpoModel) -> tuple[float, int, float]:
        rewards: list[float] = []
        steps_per_episode: list[int] = []
        successful_deliveries = 0

        for _ in range(self._config.eval_episodes):
            observation, _ = self._env.reset()
            terminated = False
            truncated = False
            total_reward = 0.0
            steps = 0
            info: dict[str, object] = {}

            while not terminated and not truncated:
                action, _ = model.predict(
                    observation,
                    deterministic=True,
                    action_masks=self._env.action_masks(),
                )
                observation, reward, terminated, truncated, info = self._env.step(int(action))
                total_reward += float(reward)
                steps += 1

            rewards.append(total_reward)
            steps_per_episode.append(steps)
            if info.get("reason") == "delivered_box":
                successful_deliveries += 1

        if not rewards:
            return 0.0, 0, 0.0

        return (
            sum(rewards) / len(rewards),
            successful_deliveries,
            sum(steps_per_episode) / len(steps_per_episode),
        )


def _stable_baselines_ppo(policy: str, env: GymLikeEnvironment, **kwargs: Any) -> PpoModel:
    from sb3_contrib import MaskablePPO

    return MaskablePPO(policy, env, **kwargs)
