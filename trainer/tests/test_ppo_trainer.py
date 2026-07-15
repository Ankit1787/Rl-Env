from pathlib import Path

from warehouse_trainer.ppo_trainer import PpoTrainer, PpoTrainingConfig


class FakeActionSpace:
    def seed(self, seed: int | None = None) -> None:
        self.seed_value = seed

    def sample(self) -> int:
        return 0


class FakeEnv:
    def __init__(self) -> None:
        self.action_space = FakeActionSpace()
        self.reset_count = 0
        self.step_count = 0

    def reset(self, *, seed: int | None = None, options: dict | None = None):
        self.reset_count += 1
        self.step_count = 0
        return [0.0], {}

    def step(self, action: int):
        self.step_count += 1
        return [0.0], 2.0, self.step_count >= 2, False, {"reason": "delivered_box"}


class FakeModel:
    def __init__(self) -> None:
        self.learn_timesteps: int | None = None
        self.saved_path: str | None = None
        self.predictions = 0

    def learn(self, total_timesteps: int):
        self.learn_timesteps = total_timesteps
        return self

    def predict(self, observation: object, deterministic: bool = True):
        self.predictions += 1
        return 0, None

    def save(self, path: str) -> None:
        self.saved_path = path
        Path(path).write_text("fake-model", encoding="utf-8")


class FakePpoFactory:
    def __init__(self) -> None:
        self.model = FakeModel()
        self.kwargs: dict | None = None
        self.policy: str | None = None
        self.env: object | None = None

    def __call__(self, policy: str, env: object, **kwargs: object) -> FakeModel:
        self.policy = policy
        self.env = env
        self.kwargs = kwargs
        return self.model


def test_ppo_trainer_learns_saves_and_evaluates(tmp_path: Path) -> None:
    env = FakeEnv()
    factory = FakePpoFactory()
    model_path = tmp_path / "models" / "warehouse_ppo.zip"
    trainer = PpoTrainer(
        env=env,
        config=PpoTrainingConfig(
            total_timesteps=128,
            learning_rate=0.001,
            n_steps=32,
            batch_size=16,
            gamma=0.95,
            model_path=str(model_path),
            eval_episodes=2,
        ),
        ppo_factory=factory,
    )

    summary = trainer.train()

    assert factory.policy == "MlpPolicy"
    assert factory.env is env
    assert factory.kwargs == {
        "learning_rate": 0.001,
        "n_steps": 32,
        "batch_size": 16,
        "gamma": 0.95,
        "verbose": 1,
    }
    assert factory.model.learn_timesteps == 128
    assert factory.model.saved_path == str(model_path)
    assert model_path.read_text(encoding="utf-8") == "fake-model"
    assert summary.model_path == str(model_path)
    assert summary.total_timesteps == 128
    assert summary.eval_episodes == 2
    assert summary.mean_reward == 4.0
