# Warehouse RL Environment

A production-style proof of concept for a reinforcement learning environment where a robot moves through a warehouse, picks up a box, and delivers it to a goal.

This project is built to teach RL environment architecture, not to be a complex game. It separates the simulation, training, and visualization into independent services.

## What This Project Does

- Simulates a warehouse grid with a robot, box, goal, and walls.
- Exposes the environment through REST and WebSocket APIs.
- Shows the warehouse live in a Nuxt/Vue viewer.
- Provides a Python Gymnasium wrapper.
- Runs a random agent.
- Supports PPO training with Stable-Baselines3 and PyTorch.
- Can run locally with Docker Compose.
- Can be deployed to a server or platform using production Dockerfiles.

## Project Structure

```text
warehouse-rl/
├── environment/          # Node.js + TypeScript environment API
├── trainer/              # Python Gymnasium, random agent, PPO trainer
├── viewer/               # Nuxt 4 + Vue 3 + Pinia + Tailwind UI
├── shared/               # Shared API documentation/contracts
├── docker-compose.yml    # Local development compose
├── docker-compose.prod.yml
├── render.yaml
├── DEPLOYMENT.md
├── .env.example
└── .env.production.example
```

## Services

### Environment

Location:

```text
warehouse-rl/environment
```

Responsibilities:

- Maintain world state.
- Validate robot actions.
- Calculate rewards.
- Manage episodes.
- Expose REST API and WebSocket events.

Endpoints:

```text
GET  /health
GET  /state
POST /reset
POST /step
GET  /events
```

Actions:

```text
move_up
move_down
move_left
move_right
pickup
drop
```

### Viewer

Location:

```text
warehouse-rl/viewer
```

Responsibilities:

- Render robot, box, goal, and walls.
- Show reward, episode, step count, and last action.
- Provide manual controls for debugging.
- Listen to WebSocket updates from the environment.

Viewer URL locally:

```text
http://localhost:3000
```

### Trainer

Location:

```text
warehouse-rl/trainer
```

Responsibilities:

- Wrap the environment as a Gymnasium environment.
- Run a random agent.
- Run PPO training.
- Save trained model artifacts.

The trainer is a job, not a public web app.

## Environment Variables

For local development:

```bash
cd warehouse-rl
cp .env.example .env
```

For production:

```bash
cp .env.production.example .env.production
```

Important variables:

```text
ENVIRONMENT_PORT=3001
VIEWER_PORT=3000
NUXT_PUBLIC_ENVIRONMENT_BASE_URL=http://localhost:3001
ENVIRONMENT_CORS_ORIGIN=http://localhost:3000
TRAINER_MODE=random
RANDOM_AGENT_EPISODES=5
PPO_TOTAL_TIMESTEPS=2000
PPO_MODEL_PATH=/app/models/warehouse_ppo.zip
```

## Run Locally With Docker

From the project folder:

```bash
cd warehouse-rl
docker compose up --build
```

Open:

```text
http://localhost:3000
```

The environment API runs at:

```text
http://localhost:3001
```

Check API health:

```bash
curl http://localhost:3001/health
```

## Run Locally Without Docker

Environment:

```bash
cd warehouse-rl/environment
npm install
npm run dev
```

Viewer:

```bash
cd warehouse-rl/viewer
npm install
npm run dev
```

Trainer is intended to run inside Docker so your host machine does not need Python, Gymnasium, PyTorch, or Stable-Baselines3 installed.

## Manual Testing In Viewer

The viewer has buttons for:

```text
Move up
Move down
Move left
Move right
Pick up
Drop
Reset
```

These buttons are for human debugging. They are not required for training.

## Run Random Agent

The random agent automatically sends actions to the environment.

```bash
cd warehouse-rl
docker compose --profile trainer run --rm \
  -e TRAINER_MODE=random \
  -e RANDOM_AGENT_EPISODES=10 \
  trainer
```

If the viewer is open, you can watch the environment update live.

## Run PPO Training

PPO training uses Stable-Baselines3.

```bash
cd warehouse-rl
docker compose --profile trainer run --rm \
  -e TRAINER_MODE=ppo \
  -e PPO_TOTAL_TIMESTEPS=2000 \
  trainer
```

The model is saved to:

```text
warehouse-rl/trainer/models/warehouse_ppo.zip
```

PPO settings:

```text
PPO_TOTAL_TIMESTEPS=2000
PPO_LEARNING_RATE=0.0003
PPO_N_STEPS=64
PPO_BATCH_SIZE=32
PPO_GAMMA=0.99
PPO_EVAL_EPISODES=3
```

## Gymnasium Observation

The trainer receives an `np.float32` vector with 11 values:

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

Coordinates and progress are normalized to `0..1`.

## Gymnasium Action Space

The action space is:

```text
Discrete(6)
```

Mapping:

```text
0 -> move_up
1 -> move_down
2 -> move_left
3 -> move_right
4 -> pickup
5 -> drop
```

## Run Tests

Environment:

```bash
cd warehouse-rl/environment
npm test
npm run build
npm run lint
```

Viewer:

```bash
cd warehouse-rl/viewer
npm run typecheck
npm run lint
npm run build
```

Trainer:

```bash
cd warehouse-rl
docker compose run --rm --no-deps trainer pytest
docker compose run --rm --no-deps trainer ruff check src tests
```

## Production Deployment

Production files:

```text
docker-compose.prod.yml
environment/Dockerfile.prod
viewer/Dockerfile.prod
trainer/Dockerfile.prod
DEPLOYMENT.md
render.yaml
```

For a server or VPS:

```bash
cd warehouse-rl
cp .env.production.example .env.production
docker compose -f docker-compose.prod.yml --env-file .env.production up --build -d environment viewer
```

Open:

```text
http://your-server:3000
```

For Render, use `render.yaml` as a blueprint and update:

```text
NUXT_PUBLIC_ENVIRONMENT_BASE_URL
ENVIRONMENT_CORS_ORIGIN
```

## Important Notes

- The viewer is public-facing.
- The environment API can be public or behind a reverse proxy.
- The trainer should not be a public website.
- Training is automatic; you do not need to click movement buttons.
- Viewer buttons are only for testing/debugging.
- `localhost` works only on your own computer.
- For public deployment, the viewer must use a browser-accessible API URL.

## Common Commands

Start local app:

```bash
docker compose up --build
```

Run random agent:

```bash
docker compose --profile trainer run --rm -e TRAINER_MODE=random trainer
```

Run PPO:

```bash
docker compose --profile trainer run --rm -e TRAINER_MODE=ppo trainer
```

Stop services:

```bash
docker compose down
```

Production start:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up --build -d environment viewer
```
