import pytest

from warehouse_trainer.config import load_config


def test_load_config_defaults_to_random_mode(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("TRAINER_MODE", raising=False)

    config = load_config()

    assert config.trainer_mode == "random"
    assert config.ppo_total_timesteps == 2000
    assert config.ppo_model_path == "/app/models/warehouse_ppo.zip"


def test_load_config_reads_ppo_values(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("TRAINER_MODE", "ppo")
    monkeypatch.setenv("PPO_TOTAL_TIMESTEPS", "512")
    monkeypatch.setenv("PPO_LEARNING_RATE", "0.001")
    monkeypatch.setenv("PPO_N_STEPS", "32")
    monkeypatch.setenv("PPO_BATCH_SIZE", "16")
    monkeypatch.setenv("PPO_GAMMA", "0.95")
    monkeypatch.setenv("PPO_MODEL_PATH", "/tmp/model.zip")
    monkeypatch.setenv("PPO_EVAL_EPISODES", "2")

    config = load_config()

    assert config.trainer_mode == "ppo"
    assert config.ppo_total_timesteps == 512
    assert config.ppo_learning_rate == 0.001
    assert config.ppo_n_steps == 32
    assert config.ppo_batch_size == 16
    assert config.ppo_gamma == 0.95
    assert config.ppo_model_path == "/tmp/model.zip"
    assert config.ppo_eval_episodes == 2


def test_load_config_rejects_unknown_mode(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("TRAINER_MODE", "unknown")

    with pytest.raises(ValueError, match="Unsupported TRAINER_MODE"):
        load_config()
