from warehouse_trainer.client import HttpWarehouseClient
from warehouse_trainer.config import TrainerConfig, load_config
from warehouse_trainer.gym_env import WarehouseGymEnv
from warehouse_trainer.ppo_trainer import PpoTrainer, PpoTrainingConfig
from warehouse_trainer.random_agent import RandomAgentRunner


def main() -> None:
    config = load_config()
    client = HttpWarehouseClient(
        base_url=config.environment_base_url,
        timeout_seconds=config.request_timeout_seconds,
    )
    env = WarehouseGymEnv(client)

    if config.trainer_mode == "ppo":
        run_ppo(env, config)
        return

    run_random(env, config)


def run_random(env: WarehouseGymEnv, config: TrainerConfig) -> None:
    runner = RandomAgentRunner(
        env=env,
        episodes=config.random_agent_episodes,
        seed=config.random_agent_seed,
    )
    summaries = runner.run()

    for summary in summaries:
        print(
            f"episode={summary.episode} steps={summary.steps} "
            f"total_reward={summary.total_reward:.2f} terminated={summary.terminated} "
            f"truncated={summary.truncated} final_reason={summary.final_reason}"
        )


def run_ppo(env: WarehouseGymEnv, config: TrainerConfig) -> None:
    trainer = PpoTrainer(
        env=env,
        config=PpoTrainingConfig(
            total_timesteps=config.ppo_total_timesteps,
            learning_rate=config.ppo_learning_rate,
            n_steps=config.ppo_n_steps,
            batch_size=config.ppo_batch_size,
            gamma=config.ppo_gamma,
            model_path=config.ppo_model_path,
            eval_episodes=config.ppo_eval_episodes,
        ),
    )
    summary = trainer.train()
    print(
        f"ppo_total_timesteps={summary.total_timesteps} "
        f"ppo_eval_episodes={summary.eval_episodes} "
        f"ppo_mean_reward={summary.mean_reward:.2f} "
        f"ppo_model_path={summary.model_path}"
    )


if __name__ == "__main__":
    main()
