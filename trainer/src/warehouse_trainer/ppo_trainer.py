from dataclasses import dataclass
from pathlib import Path
from typing import Any, Callable, Protocol

from warehouse_trainer.random_agent import GymLikeEnvironment


class PpoModel(Protocol):
    def learn(self, total_timesteps: int):
        ...

    def predict(self, observation: object, deterministic: bool = True):
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
        mean_reward = self._evaluate(model)

        return PpoTrainingSummary(
            model_path=self._config.model_path,
            total_timesteps=self._config.total_timesteps,
            eval_episodes=self._config.eval_episodes,
            mean_reward=mean_reward,
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

    def _evaluate(self, model: PpoModel) -> float:
        rewards: list[float] = []

        for _ in range(self._config.eval_episodes):
            observation, _ = self._env.reset()
            terminated = False
            truncated = False
            total_reward = 0.0

            while not terminated and not truncated:
                action, _ = model.predict(observation, deterministic=True)
                observation, reward, terminated, truncated, _ = self._env.step(int(action))
                total_reward += float(reward)

            rewards.append(total_reward)

        if not rewards:
            return 0.0

        return sum(rewards) / len(rewards)


def _stable_baselines_ppo(policy: str, env: GymLikeEnvironment, **kwargs: Any) -> PpoModel:
    from stable_baselines3 import PPO

    return PPO(policy, env, **kwargs)
