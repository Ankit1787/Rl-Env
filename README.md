# Warehouse RL

Warehouse RL is a Docker-based reinforcement-learning project. A robot must navigate a warehouse, reach a box, pick it up, carry it around walls, and drop it on a goal. The repository includes a browser viewer, a TypeScript simulation API, and a Python trainer with random and PPO modes.

This README is written for someone running the project for the first time.

## Quick start


```bash
cd ./warehouse-rl
docker compose up --build -d
docker compose run --rm trainer
```
then run ppo mode for train the model

```bash
docker compose run --rm \
  -e TRAINER_MODE=ppo \
  -e PPO_TOTAL_TIMESTEPS=2000 \
  trainer
```

### Go to Localhost:3000

```bash
http://localhost:3000/
```
There are two modes  (by default mode is random).You have to pass environment valiable for eg: TRAINER_MODE=ppo

### Random mode

```bash
docker compose run --rm \
  -e TRAINER_MODE=random \
  -e RANDOM_AGENT_EPISODES=10 \
  -e RANDOM_AGENT_SEED=42 \
  trainer
```
### PPO mode ( Recommended )

```bash
docker compose run --rm \
  -e TRAINER_MODE=ppo \
  -e PPO_TOTAL_TIMESTEPS=2000 \
  trainer
```

The `warehouse-rl` root does **not** contain a `package.json`. Do not run `npm install` or `npm run dev` from the root. The Node applications have separate package files under `environment/` and `viewer/`, and Docker installs their dependencies inside their containers.

## Project structure

```text
warehouse-rl/
├── environment/              Node/TypeScript simulation and API
│   ├── src/api/              REST and WebSocket endpoints
│   ├── src/domain/           Grid, movement, pickup, drop, and rewards
│   └── test/                 Environment and API tests
├── trainer/                  Python reinforcement-learning job
│   ├── src/warehouse_trainer/
│   ├── tests/                Trainer tests
│   └── models/               Saved PPO models
├── viewer/                   Nuxt/Vue browser interface
│   ├── components/           Grid, controls, and statistics
│   ├── stores/               API, WebSocket, and frontend state
│   └── types/                TypeScript API types
├── shared/                   Shared-contract documentation
├── docker-compose.yml        Local service orchestration
└── .env.example              Runtime defaults
```

## Architecture and responsibilities

```text
Browser
  |
  | HTTP actions and WebSocket events
  v
Viewer (Nuxt/Vue) <----> Environment API (Node/TypeScript)
                              ^
                              | HTTP state/reset/step calls
                              |
                        Trainer (Python)
```

### Environment

Location: `environment/`

Libraries: Node.js, TypeScript, Fastify, Zod, and `@fastify/websocket`.

The environment owns the authoritative state: robot position, box position, goal, walls, rewards, episode number, step count, and terminal state. The viewer and trainer request actions; only the environment decides whether they are valid and what reward they receive.

Important files:

```text
environment/src/main.ts                         Service entry point
environment/src/app.ts                          Fastify setup
environment/src/config.ts                       Configuration parsing
environment/src/api/routes.ts                    REST endpoints
environment/src/api/websocket.ts                 Live event endpoint
environment/src/domain/warehouseEnvironment.ts  Simulation rules
environment/src/domain/grid.ts                  Grid and wall checks
environment/src/domain/rewardCalculator.ts      Reward mapping
```

API endpoints:

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/health` | Readiness check |
| `GET` | `/state` | Current warehouse state |
| `POST` | `/reset` | Start a new episode |
| `POST` | `/step` | Apply one action |
| WebSocket | `/events` | Push state updates to the viewer |

### Viewer

Location: `viewer/`

Libraries: Nuxt 4, Vue 3, Pinia, Tailwind CSS, and TypeScript.

The viewer runs on port `3000`. It renders the grid, robot, box, goal, walls, reward, episode, step count, last action, and WebSocket status. Manual controls send `/step` and `/reset` requests to the environment.

Important files:

```text
viewer/app.vue                         Main page
viewer/stores/environment.ts           REST, WebSocket, and UI state
viewer/components/WarehouseGrid.vue    Grid rendering
viewer/components/ActionControls.vue   Action buttons
viewer/components/EnvironmentStats.vue Episode and reward information
```

### Trainer

Location: `trainer/`

Libraries: Python, Gymnasium, Stable-Baselines3, PyTorch, NumPy, and Requests.

The trainer is a finite command job, not a permanent server. It runs configured episodes or PPO timesteps, prints results, optionally saves a model, and exits.

Important files:

```text
trainer/src/warehouse_trainer/main.py         Entry point and mode selection
trainer/src/warehouse_trainer/client.py       Environment HTTP client
trainer/src/warehouse_trainer/gym_env.py      Gymnasium adapter
trainer/src/warehouse_trainer/actions.py      Integer/action mapping
trainer/src/warehouse_trainer/random_agent.py Random baseline
trainer/src/warehouse_trainer/ppo_trainer.py  PPO training and evaluation
trainer/src/warehouse_trainer/config.py       Trainer configuration
trainer/models/                               Persistent model output
```


## Trainer modes

### Random mode

```bash
docker compose run --rm \
  -e TRAINER_MODE=random \
  -e RANDOM_AGENT_EPISODES=10 \
  -e RANDOM_AGENT_SEED=42 \
  trainer
```

Random mode samples one of six actions on every step. It does not remember, update a model, or improve. It is used to test API connectivity, action handling, rewards, reset behavior, and viewer updates.

Even when it reaches the box, it has only a `1/6` chance of choosing `pickup` next. Repeated mistakes are expected.

| Variable | Meaning |
|---|---|
| `TRAINER_MODE=random` | Select random mode |
| `RANDOM_AGENT_EPISODES` | Episodes to run |
| `RANDOM_AGENT_SEED` | Reproduce the same random sequence |

### PPO learning mode

```bash
docker compose run --rm \
  -e TRAINER_MODE=ppo \
  -e PPO_TOTAL_TIMESTEPS=100000 \
  trainer
```

PPO uses Stable-Baselines3 `MlpPolicy`, a PyTorch multilayer perceptron trained from scratch. It is not a pretrained language or vision model. `2000` timesteps is useful for a short pipeline test; `100000` gives more opportunity to learn but takes longer.

| Variable | Default | Meaning |
|---|---:|---|
| `PPO_TOTAL_TIMESTEPS` | `2000` | Environment interactions used for training |
| `PPO_LEARNING_RATE` | `0.0003` | Neural-network update size |
| `PPO_N_STEPS` | `64` | Rollout length before an update |
| `PPO_BATCH_SIZE` | `32` | Samples in each minibatch |
| `PPO_GAMMA` | `0.99` | Importance of future rewards |
| `PPO_MODEL_PATH` | `/app/models/warehouse_ppo.zip` | Saved model path |
| `PPO_EVAL_EPISODES` | `3` | Evaluation episodes after training |

Override multiple variables for one container:

```bash
docker compose run --rm \
  -e TRAINER_MODE=ppo \
  -e PPO_TOTAL_TIMESTEPS=100000 \
  -e PPO_N_STEPS=128 \
  -e PPO_BATCH_SIZE=64 \
  -e PPO_EVAL_EPISODES=10 \
  trainer
```

`-e NAME=value` overrides an environment variable for that run only.



## Manual API checks

```bash
curl http://localhost:3001/health
curl http://localhost:3001/state
curl -X POST http://localhost:3001/reset
curl -X POST http://localhost:3001/step \
  -H 'content-type: application/json' \
  -d '{"action":"move_right"}'
```

## Troubleshooting

### `localhost:3000` is not showing the viewer

```bash
cd ./warehouse-rl
docker compose ps
docker compose logs --tail=100 viewer
curl -I http://localhost:3000
```

Expected services are `environment` as healthy on port `3001` and `viewer` as up on port `3000`.

If the viewer is missing:

```bash
docker compose up --build -d viewer
```

### Viewer says environment state is unavailable

```bash
curl http://localhost:3001/health
curl http://localhost:3001/state
docker compose logs --tail=100 environment
```

The host browser uses `http://localhost:3001`; the trainer container uses `http://environment:3001`.

After configuration changes, recreate services:

```bash
docker compose up --build -d --force-recreate environment viewer
```

### Viewer is connected but controls are disabled

If the UI shows `100 / 100`, `max_steps_reached`, and `done`, the episode finished normally. Select **Reset Episode** or run:

```bash
curl -X POST http://localhost:3001/reset
```

### Trainer shows `Exited (0)`

The finite job completed successfully. Start another job when needed:

```bash
docker compose run --rm trainer
```

For profile-created containers:

```bash
docker compose --profile trainer ps -a
docker compose --profile trainer logs trainer
```

### Trainer cannot connect

```bash
docker compose up -d environment
curl http://localhost:3001/health
docker compose run --rm trainer
```

Inspect the URL seen by Python:

```bash
docker compose run --rm trainer \
  python -c "from warehouse_trainer.config import load_config; print(load_config().environment_base_url)"
```

It should print `http://environment:3001`.

### Trainer repeats mistakes

Random mode never learns. Use PPO with more timesteps:

```bash
docker compose run --rm \
  -e TRAINER_MODE=ppo \
  -e PPO_TOTAL_TIMESTEPS=100000 \
  trainer
```

### Clean restart

```bash
docker compose down
docker compose up --build -d environment viewer
```

Do not add `-v` unless you intentionally want to remove Docker volumes.

## Tests

The first command is a Docker Compose command. `npm test` runs inside the
`environment` container, whose source folder has its own `package.json`; it is
not an npm command run from the `warehouse-rl` project root.

```bash
docker compose run --rm environment npm test
docker compose run --rm trainer pytest
```

## Recommended workflow

```bash
# Terminal 1
cd ./warehouse-rl
docker compose up --build -d environment viewer
docker compose ps
curl http://localhost:3001/health

# Terminal 2: short random smoke test
cd ./warehouse-rl
docker compose run --rm \
  -e TRAINER_MODE=random \
  -e RANDOM_AGENT_EPISODES=5 \
  trainer

# Or actual PPO learning
docker compose run --rm \
  -e TRAINER_MODE=ppo \
  -e PPO_TOTAL_TIMESTEPS=100000 \
  trainer
```

Open <http://localhost:3000> to observe the environment. Remember: the trainer is a finite job, `--rm` cleans up its temporary container, random mode does not learn, and PPO requires enough experience and an uninterrupted environment to improve.
