# Warehouse RL POC

Production-quality proof of concept for a warehouse reinforcement learning environment.

The project is intentionally split into services:

- `environment`: Node.js + TypeScript service that owns simulation state and rewards.
- `trainer`: Python-only-in-Docker service for Gymnasium, Stable-Baselines3, and PyTorch.
- `viewer`: Nuxt 4 + Vue 3 UI for visualizing the environment.
- `shared`: shared API contracts and documentation.

## Current Scope

Phase 1 initialized the monorepo, Docker layout, TypeScript configuration, Python trainer configuration, and Nuxt viewer configuration.

Phase 2 adds the in-process warehouse simulation domain model in `environment/src/domain`.

Implemented in Phase 2:

- Grid bounds and wall validation.
- Robot movement.
- Box pickup.
- Box movement while carried.
- Delivery by dropping the box on the goal.
- Configurable rewards.
- Episode step counting and max-step termination.

Phase 3 exposes the environment through REST endpoints and a WebSocket event stream.

Implemented in Phase 3:

- `GET /health`
- `GET /state`
- `POST /reset`
- `POST /step`
- `GET /events` WebSocket stream

Viewer rendering and trainer logic come in later phases.

Phase 4 adds the Nuxt viewer:

- Warehouse grid rendering.
- Robot, box, goal, and wall visualization.
- Action controls for movement, pickup, drop, and reset.
- Reward, episode, step count, last action, robot status, and WebSocket status.
- Live updates from the environment `/events` stream.

Phase 5 adds the Python Gymnasium wrapper:

- `WarehouseGymEnv`
- Discrete action space with six actions.
- Normalized numeric observation vector.
- HTTP client for `/state`, `/reset`, and `/step`.
- Unit tests using fake clients so wrapper behavior is testable without a live Node service.

Phase 6 adds the random agent:

- Samples from the Gymnasium action space.
- Runs configurable episode counts.
- Supports deterministic action-space seeding.
- Prints per-episode summaries with steps, total reward, termination flags, and final reason.

Phase 7 adds PPO training:

- Stable-Baselines3 PPO with `MlpPolicy`.
- Configurable timesteps, learning rate, rollout steps, batch size, gamma, and evaluation episodes.
- Saves trained model artifacts to `trainer/models`.
- Prints model path and evaluation mean reward.

## Run

```bash
cp .env.example .env
docker compose up --build
```

For local development without Docker:

```bash
cd environment
npm run dev

cd ../viewer
npm run dev
```

The trainer service is configured but not started by default. Run it with:

```bash
docker compose --profile trainer up --build
```

Random agent settings:

```text
TRAINER_MODE=random
RANDOM_AGENT_EPISODES=5
RANDOM_AGENT_SEED=42
```

PPO settings:

```text
TRAINER_MODE=ppo
PPO_TOTAL_TIMESTEPS=2000
PPO_LEARNING_RATE=0.0003
PPO_N_STEPS=64
PPO_BATCH_SIZE=32
PPO_GAMMA=0.99
PPO_MODEL_PATH=/app/models/warehouse_ppo.zip
PPO_EVAL_EPISODES=3
```

The trainer is intended to run in Docker so the host machine does not need Python, Gymnasium, PyTorch, or Stable-Baselines3 installed.

## Trainer Observation Vector

`WarehouseGymEnv` returns an `np.float32` vector with 11 values:

```text
robot_x
robot_y
box_x
box_y
goal_x
goal_y
robot_carrying_box
box_delivered
step_progress
done
positive_reward_scaled
```

Coordinates and step progress are normalized to `0..1`.

## Trainer Action Space

The Gymnasium action space is `Discrete(6)`:

```text
0 -> move_up
1 -> move_down
2 -> move_left
3 -> move_right
4 -> pickup
5 -> drop
```

## Public API Targets

The environment service exposes:

- `GET /health`
- `GET /state`
- `POST /reset`
- `POST /step`
- `GET /events` as a WebSocket stream

Example step request:

```bash
curl -X POST http://localhost:3001/step \
  -H 'content-type: application/json' \
  -d '{"action":"move_right"}'
```

Example reset request:

```bash
curl -X POST http://localhost:3001/reset
```

WebSocket events are JSON payloads:

```json
{
  "type": "step",
  "result": {
    "reward": -1,
    "done": false
  }
}
```

## Environment Domain API

The in-process TypeScript API is available before the REST layer:

```ts
const environment = new WarehouseEnvironment(options);

environment.reset();
environment.step('move_right');
environment.getState();
```

Supported actions:

- `move_up`
- `move_down`
- `move_left`
- `move_right`
- `pickup`
- `drop`
