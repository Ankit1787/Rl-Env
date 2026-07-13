import { Grid } from './grid.js';
import { movePosition, positionsEqual } from './position.js';
import { RewardCalculator } from './rewardCalculator.js';
import type {
  Action,
  Position,
  StepReason,
  StepResult,
  WarehouseEnvironmentOptions,
  WarehouseState,
} from './types.js';

const ACTION_DELTAS: Readonly<Record<Action, Position | undefined>> = {
  move_up: { x: 0, y: -1 },
  move_down: { x: 0, y: 1 },
  move_left: { x: -1, y: 0 },
  move_right: { x: 1, y: 0 },
  pickup: undefined,
  drop: undefined,
};

export class WarehouseEnvironment {
  private readonly grid: Grid;
  private readonly rewardCalculator: RewardCalculator;
  private episode = 0;
  private state: WarehouseState;

  constructor(private readonly options: WarehouseEnvironmentOptions) {
    this.grid = new Grid(options.layout);
    this.rewardCalculator = new RewardCalculator(options.rewards);
    this.state = this.createInitialState(0);
  }

  reset(): WarehouseState {
    this.episode += 1;
    this.state = this.createInitialState(this.episode);
    return this.getState();
  }

  getState(): WarehouseState {
    return this.state;
  }

  step(action: Action): StepResult {
    if (this.state.done) {
      return this.resultFor('episode_already_done', false, action);
    }

    if (action === 'pickup') {
      return this.pickup(action);
    }

    if (action === 'drop') {
      return this.drop(action);
    }

    return this.move(action);
  }

  private move(action: Action): StepResult {
    const delta = ACTION_DELTAS[action];

    if (delta === undefined) {
      return this.resultFor('episode_already_done', false, action);
    }

    const nextPosition = movePosition(this.state.robot.position, delta);

    if (!this.grid.isInside(nextPosition)) {
      return this.advanceStep('out_of_bounds', false, action);
    }

    if (this.grid.isWall(nextPosition)) {
      return this.advanceStep('hit_wall', false, action);
    }

    const nextBox = this.state.robot.carryingBox
      ? {
          ...this.state.box,
          position: nextPosition,
        }
      : this.state.box;

    return this.advanceStep('moved', true, action, {
      robotPosition: nextPosition,
      box: nextBox,
    });
  }

  private pickup(action: Action): StepResult {
    if (this.state.box.isDelivered) {
      return this.advanceStep('already_delivered', false, action);
    }

    if (!positionsEqual(this.state.robot.position, this.state.box.position)) {
      return this.advanceStep('not_at_box', false, action);
    }

    return this.advanceStep('picked_up_box', true, action, {
      carryingBox: true,
    });
  }

  private drop(action: Action): StepResult {
    if (!this.state.robot.carryingBox) {
      return this.advanceStep('not_carrying_box', false, action);
    }

    if (positionsEqual(this.state.robot.position, this.state.goal)) {
      return this.advanceStep('delivered_box', true, action, {
        carryingBox: false,
        box: {
          position: this.state.goal,
          isDelivered: true,
        },
        done: true,
      });
    }

    return this.advanceStep('not_at_goal', false, action);
  }

  private advanceStep(
    reason: StepReason,
    valid: boolean,
    action: Action,
    changes: {
      readonly robotPosition?: Position;
      readonly carryingBox?: boolean;
      readonly box?: WarehouseState['box'];
      readonly done?: boolean;
    } = {},
  ): StepResult {
    const nextStepCount = this.state.stepCount + 1;
    const reachedMaxSteps = nextStepCount >= this.options.maxSteps;
    const terminalReason = changes.done
      ? reason
      : reachedMaxSteps
        ? 'max_steps_reached'
        : undefined;
    const rewardReason = reachedMaxSteps && !changes.done ? 'max_steps_reached' : reason;
    const reward = this.rewardCalculator.forReason(rewardReason);

    this.state = {
      ...this.state,
      stepCount: nextStepCount,
      done: changes.done ?? reachedMaxSteps,
      robot: {
        position: changes.robotPosition ?? this.state.robot.position,
        carryingBox: changes.carryingBox ?? this.state.robot.carryingBox,
      },
      box: changes.box ?? this.state.box,
      lastAction: action,
      lastReward: reward,
      ...(terminalReason === undefined ? {} : { terminalReason }),
    };

    return {
      state: this.getState(),
      reward,
      done: this.state.done,
      info: {
        reason: rewardReason,
        valid,
      },
    };
  }

  private resultFor(reason: StepReason, valid: boolean, action: Action): StepResult {
    const reward = this.rewardCalculator.forReason(reason);

    this.state = {
      ...this.state,
      lastAction: action,
      lastReward: reward,
    };

    return {
      state: this.getState(),
      reward,
      done: this.state.done,
      info: {
        reason,
        valid,
      },
    };
  }

  private createInitialState(episode: number): WarehouseState {
    return {
      episode,
      stepCount: 0,
      maxSteps: this.options.maxSteps,
      done: false,
      robot: {
        position: this.options.layout.robotStart,
        carryingBox: false,
      },
      box: {
        position: this.options.layout.boxStart,
        isDelivered: false,
      },
      goal: this.options.layout.goalPosition,
      walls: this.options.layout.walls,
      width: this.options.layout.width,
      height: this.options.layout.height,
      lastReward: 0,
    };
  }
}
