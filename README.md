# Warehouse RL Control

Warehouse RL Control is a beginner-friendly reinforcement-learning project. A
robot moves around a warehouse, finds a box, picks it up, carries it to a goal,
and drops it there. You can watch everything happen live in a browser and start
training without typing environment variables for every run.

## Reinforcement-learning words in simple language

| Word | Meaning in this project |
|---|---|
| Agent | The decision-maker. In PPO mode, this is the neural-network policy controlling the robot. |
| Environment | The warehouse simulation containing the grid, robot, box, goal, walls, and rules. |
| Observation | The information the trainer receives about the current warehouse state. |
| Action | One choice made by the agent, such as `move_right` or `pickup`. |
| Step | One action followed by the environment's new state and reward. |
| Reward | A number telling the agent whether the latest action was useful or harmful. |
| Episode | One complete attempt, from reset until delivery or the maximum-step limit. |
| Policy | The strategy PPO learns for choosing an action from an observation. |
| Training | Collecting experience and changing the policy's neural-network weights. |
| Evaluation | Testing the learned policy without changing its weights. |

## What the robot is trying to learn

The task is:

```text
Move to the box → pick up the box → move to the goal → drop the box
```

The robot can choose one of six actions:

```text
move up     move down     move left     move right     pick up     drop
```

The robot is not given the correct sequence. It receives rewards and penalties
after actions. PPO uses that feedback to make useful actions more likely over
time. An action mask prevents choices that are physically impossible in the
current state, such as picking up away from the box or dropping away from the
goal.

## Quick start

### 1. Install the requirements

Install:

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Git

Start Docker Desktop before running the project. Node.js and Python do not need
to be installed separately because Docker supplies them inside containers.

### 2. Download the project

```bash
git clone https://github.com/Ankit1787/Rl-Env.git
cd Rl-Env
```

If the project is already on your computer, open a terminal in its root folder.
The root is the folder containing `docker-compose.yml`.

### 3. Start the application

```bash
docker compose up --build -d
```

The first build can take several minutes because the trainer downloads Python,
PyTorch, Stable-Baselines3, and other dependencies.

### 4. Open the browser interface

Open <http://localhost:3000>.

<img width="2862" height="1610" alt="image" src="https://github.com/user-attachments/assets/aaa817dc-02be-4f03-8c68-17bfb3d8aa50" />

You should see `CONNECTED` near the top-right. You can now configure and start a
training run from the **Training setup** panel.

### 5. Stop the application

```bash
docker compose down
```

Do not add `-v` unless you intentionally want to remove Docker volumes.


## Understanding the screen

### Warehouse grid

| Appearance | Meaning |
|---|---|
| Blue circle | Robot |
| Yellow square | Box |
| Green cell/dot | Delivery goal |
| Dark blocked cell | Wall |
| Small yellow square on the robot | Robot is carrying the box |

<img width="2880" height="1632" alt="image" src="https://github.com/user-attachments/assets/b543f4be-27b7-40c9-a9c6-f4ed93b705ba" />



Grid coordinates start at zero. For an `8 × 8` grid, valid X and Y values are
`0` through `7`. For a `3 × 3` grid, valid values are `0` through `2`.

`X` means **column** and moves from left to right. `Y` means **row** and moves
from top to bottom. Therefore, `(x=0, y=5)` means the first column of row 5,
while `(x=5, y=0)` means column 5 of the first row. The frontend labels these
fields as **Column (X)** and **Row (Y)** to make the order clear. The goal is
marked with a visible green `G` badge.

### Status cards

| Card | Meaning |
|---|---|
| Reward | Feedback from the most recent action |
| Episode | Number of times the environment has been reset |
| Steps | Actions used in the current episode and the episode limit |
| Socket | Whether live browser updates are connected |
| Last action | Most recent action selected by the user or trainer |
| Last result | Result of that action, such as `moved` or `hit_wall` |
| Robot | Current robot coordinates and whether it carries the box |


<img width="2840" height="646" alt="image" src="https://github.com/user-attachments/assets/d3785305-d557-41ae-b584-9657ef9f153f" />


An episode is one attempt at completing the warehouse task. It ends when the
box is delivered or the maximum number of actions is reached. Starting the next
attempt increases the episode counter.

### Common last-result values

| Result | Meaning |
|---|---|
| `moved` | Robot moved successfully |
| `hit_wall` | Robot tried to enter a wall |
| `out_of_bounds` | Robot tried to leave the grid |
| `picked_up_box` | Robot picked up the box |
| `delivered_box` | Box was dropped on the goal |
| `not_at_box` | Pick up was selected away from the box |
| `not_at_goal` | Drop was selected away from the goal |
| `max_steps_reached` | The episode used all allowed actions |

### Manual controls

The arrow buttons move the robot. **Pick up** works when the robot occupies the
same cell as the box. **Drop** completes the task only when the robot is carrying
the box and is on the goal. **Reset Episode** starts a fresh attempt.

Manual controls are mainly for understanding and testing the environment. Avoid
pressing them during PPO training because the trainer and the browser share one
warehouse state.

Selecting `drop` away from the goal does **not** release the box. It is an
invalid action with a penalty, and the robot remains in the carrying state. A
carried box is displayed only as the small yellow marker attached to the robot;
it is no longer drawn as a separate box on the floor. The full yellow box
appears only before pickup; successful delivery marks it as delivered.

## Starting training from the browser

The browser is the normal way to start a run. Environment variables are only
deployment defaults or an advanced automation option.

1. Select **Random** or **PPO**.
2. Choose the number of columns and rows.
3. Choose the maximum actions allowed per episode.
4. Expand **Object positions** and place the robot, box, and goal.
5. Open the mode-specific settings.
6. Select **Start training**.

Changing the grid size automatically updates valid coordinate limits. The
warehouse grid changes to the selected layout when the run begins.

The default layout is `4 × 4`: robot at `(0,0)`, box at `(1,1)`, goal at
`(3,3)`, and 10 maximum actions. When rows or columns change, the goal defaults
to the new bottom-right cell, but the user can then move it anywhere inside the
grid. Robot, box, and goal coordinates are all editable and clamped to the
selected grid. For example, a `5 × 5` grid accepts only `0–4`; entering `6` is
reduced to `4` before training starts.

## Training modes

### Random mode: a system test, not learning

Random mode selects one of the six actions at random on every step. It has no
memory and does not update a model. Running it longer does not make it smarter.

Use Random mode to verify that:

- the trainer can reach the environment API;
- actions, rewards, resets, and live events work;
- the browser grid updates; and
- the complete Docker setup is connected correctly.

Random mode may repeatedly hit walls, try to pick up an absent box, or fail to
deliver. That behavior is expected.

Random settings:

| Setting | Meaning |
|---|---|
| Episodes | Number of complete attempts to run |
| Seed | Makes the same random action sequence reproducible |

### PPO mode: learning from rewards

PPO means **Proximal Policy Optimization**. It is a reinforcement-learning
algorithm. The model starts with no knowledge of the correct route. It gathers
experience and changes the weights of a neural network so actions that lead to
better long-term rewards become more likely.

PPO is not a pretrained language model. It learns this warehouse task from
scratch.

PPO settings:

Think of PPO as a student robot with a practice notebook:

1. The robot performs actions and writes the results in its notebook.
2. After collecting a group of experiences, it studies them.
3. It slightly changes its strategy.
4. It repeats this process until it has used the requested training timesteps.
5. Finally, it takes an evaluation test without learning from the test.

| Setting | Easy meaning | Example |
|---|---|---|
| Training timesteps | Total number of practice actions. One movement, pickup, or drop is one timestep. | `10,000` means the robot gets about 10,000 opportunities to act and observe the result. It does **not** mean 10,000 episodes. |
| Rollout steps | Number of experiences written in the notebook before PPO stops to study and update its strategy. | With `64`, PPO collects 64 actions and results, then performs a learning update. |
| Batch size | Number of notebook entries studied together during one small learning calculation. | With a rollout of `64` and batch size `32`, the 64 experiences are studied in groups of 32. In this app, batch size cannot be larger than rollout steps. |
| Learning rate | How strongly the strategy changes after learning from a batch. | `0.0003` makes small, careful changes. A very large value may make learning unstable; a very small value may make learning extremely slow. |
| Gamma | How much the robot cares about rewards that happen later instead of only the next action. | With `0.99`, the robot strongly values the future `+50` delivery reward, even when it must first make several movements that each cost `-1`. |
| Evaluation episodes | Number of test attempts after training. The policy is used but its weights are not changed. | With `3`, the trained robot attempts the warehouse task three times and the trainer measures its average reward. |

<img width="2880" height="1628" alt="image" src="https://github.com/user-attachments/assets/5ba66bfa-dd0d-411a-885c-da241c00ec99" />


### Worked PPO example

Suppose you select:

```text
Training timesteps:  10,000
Rollout steps:           64
Batch size:              32
Learning rate:       0.0003
Gamma:                  0.99
Evaluation episodes:       3
```

In simple terms:

1. The robot starts with a mostly unhelpful strategy.
2. It performs 64 actions and records each observation, action, reward, and next
   observation.
3. PPO studies those 64 records in groups of 32 and updates the neural network.
4. The robot collects another 64 records and learns again.
5. This continues until it has performed approximately 10,000 training actions.
   PPO works with complete rollouts, so the actual number can be slightly above
   the requested value.
6. The model is saved.
7. The saved policy runs three evaluation episodes. The episode counter still
   moves during this test, but the model is no longer learning.
8. The run changes to **Completed** after all three test episodes finish.

### Which values should a beginner use?

Start with:

```text
Training timesteps:  10,000 for a short experiment
Rollout steps:           64
Batch size:              32
Learning rate:       0.0003
Gamma:                  0.99
Evaluation episodes:       3
```

Use `1,000–2,000` timesteps only to confirm that the complete system runs. The
robot may learn very little. Try `50,000–100,000` when you want to check whether
behavior improves. More timesteps provide more practice but do not guarantee a
good policy, especially when the grid is large or the task is difficult.

For your first experiments, change only **training timesteps**. Keep rollout
steps, batch size, learning rate, and gamma at their defaults. Changing many
values together makes it difficult to understand which change helped or hurt.

## Training, evaluation, and completion

A PPO run has separate phases:

```text
Training → Save model → Evaluation → Completed
```

During **Training**, PPO collects experience and updates the neural network.
During **Evaluation**, learning has stopped, but the saved policy still controls
the warehouse for the configured number of evaluation episodes. Therefore, the
episode and step counters continue moving during evaluation. This is expected;
it is not a delayed or restarted training job.

The browser status badge shows **Training**, **Evaluating**, and **Completed**.
After evaluation, the browser displays the success rate, successful deliveries,
average reward, and average number of steps. These results make it possible to
compare training runs without reading container logs.

The trained PPO model is stored at:

```text
trainer/models/warehouse_ppo.zip
```

## Rewards and penalties

Rewards tell PPO whether an action was useful. The defaults are:

| Event | Reward | Why |
|---|---:|---|
| Move closer to current target | `+1` | Gives the robot a useful direction signal |
| Move farther from current target | `-2` | Discourages movement away from the box or goal |
| Revisit a cell in the same episode | `-3` | Discourages up/down and left/right loops |
| Sideways movement at the same distance | `-1` | Encourages shorter routes |
| Invalid action | `-5` | Discourages impossible actions |
| Wall collision | `-5` | Discourages blocked routes |
| Successful pickup | `+10` | Rewards reaching and collecting the box |
| Successful delivery | `+50` | Strongly rewards completing the task |

A negative value in the Reward card is not an application error. It is feedback
for the agent.

Before pickup, the current target is the box. After pickup, the current target
is the goal. The trainer observation also tells PPO whether the cells directly
above, below, left, and right are blocked by a wall or grid boundary. This helps
the policy avoid becoming trapped in a small movement loop. Four explicit
signals also say whether the robot is at the box, at the goal, allowed to pick
up, or allowed to drop.

PPO uses an action mask to allow only valid choices:

- when the empty robot reaches the box, movement is paused and only `pickup` is
  available;
- after pickup, `pickup` remains unavailable while movement toward the goal is
  available;
- when the carrying robot reaches the goal, movement is paused and only `drop`
  is available; and
- movement into a wall or outside the grid is unavailable.

The mask does not solve the route. PPO must still learn which valid movements
lead to the box and then to the goal. Pickup and drop are treated as mandatory
warehouse workflow steps, so PPO focuses on learning navigation rather than
wasting experience by walking away at the exact pickup or delivery cell. Random
mode remains an unmasked connectivity test and may still choose invalid actions.

Because the observation changed from 15 values to 19 values, PPO models created
by an older version are not compatible with this version. Rebuild the services
and train a fresh model after updating.

## How the project works

Three services run together:

```text
Browser (port 3000)
    │
    ├── starts a run ───────────────► Trainer API (Python, port 8000)
    │                                      │
    │                                      │ reset and step requests
    │                                      ▼
    └── state + live events ◄────── Environment API (TypeScript, port 3001)
```

### Viewer

The `viewer/` service uses Nuxt, Vue, Pinia, Tailwind CSS, and TypeScript. It
displays the grid and statistics, accepts training settings, starts a trainer
run, provides manual controls, and receives live updates through WebSockets.

### Environment

The `environment/` service uses Node.js, TypeScript, Fastify, and Zod. It owns
the real warehouse state and decides whether an action is valid, what reward it
gets, and whether an episode is finished.

Main endpoints:

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/health` | Check environment availability |
| `GET` | `/state` | Read current warehouse state |
| `POST` | `/configure` | Apply the selected grid and object positions |
| `POST` | `/reset` | Begin another episode |
| `POST` | `/step` | Apply one robot action |
| WebSocket | `/events` | Send live changes to the browser |

### Trainer

The `trainer/` service uses Python, FastAPI, Gymnasium, Stable-Baselines3,
PyTorch, and NumPy. It remains available on port `8000`, accepts the browser's
configuration, runs Random or PPO, saves the model, performs evaluation, and
reports the run status.

## Project folders

```text
environment/                 TypeScript simulation and API
trainer/                     Python trainer and saved models
viewer/                      Browser application
shared/                      Shared-contract documentation
docker-compose.yml           Local Docker services
docker-compose.prod.yml      Production Docker services
.env.example                 Local default values
.env.production.example      Production default values
```

The root folder intentionally has no `package.json`. Do not run `npm install`
from the project root. Docker installs each service's dependencies in the
correct container.

## Useful commands

For a production VPS deployment using the included Nginx reverse proxy, follow
[DEPLOYMENT.md](DEPLOYMENT.md).

```bash
# Start or rebuild all services
docker compose up --build -d

# Show service status
docker compose ps

# Follow logs
docker compose logs -f environment trainer viewer

# Restart all services after code changes
docker compose up --build -d --force-recreate

# Stop services
docker compose down
```

Health checks:

```bash
curl http://localhost:3001/health
curl http://localhost:8000/health
curl http://localhost:3001/state
curl http://localhost:8000/training/status
```

## Troubleshooting

### The page does not open

```bash
docker compose ps
docker compose logs --tail=100 viewer
```

Confirm that Docker Desktop is running and port `3000` is not used by another
application.

### The page opens but says disconnected

```bash
curl http://localhost:3001/health
docker compose logs --tail=100 environment
```

Rebuild the services if the API is unavailable:

```bash
docker compose up --build -d --force-recreate
```

### Starting training fails

```bash
curl http://localhost:8000/health
docker compose logs --tail=200 trainer
```

Make sure the trainer service is running. For positions, remember that
coordinates begin at zero. On a `3 × 3` grid, `(3,3)` is outside the grid; the
bottom-right position is `(2,2)`.

### The episode counter keeps increasing after training timesteps finish

PPO is running its evaluation episodes. The UI should display **Evaluating**.
Wait until the status changes to **Completed**.

### The robot repeats bad actions

- Random mode never learns.
- A small PPO timestep count is only a pipeline test.
- PPO begins untrained, so poor early behavior is expected.
- Larger grids and walls make the task harder.
- Do not manually control or reset the shared environment during training.

### Steps show `100 / 100` and controls are disabled

The episode reached its action limit. Select **Reset Episode** to begin a new
attempt.

### Clean restart

```bash
docker compose down
docker compose up --build -d
```

## Running tests

```bash
docker compose run --rm environment npm test
docker compose run --rm trainer pytest
```

## Beginner checklist

1. Start Docker Desktop.
2. Run `docker compose up --build -d` from the repository root.
3. Open <http://localhost:3000> and confirm it says `CONNECTED`.
4. Use Random mode for a short system test.
5. Use PPO when you want the robot to learn.
6. Do not manually control the warehouse during PPO training.
7. Expect the episode counter to move during evaluation.
8. Use `docker compose logs -f trainer` if a run fails.
