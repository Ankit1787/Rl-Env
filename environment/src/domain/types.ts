export const ACTIONS = ['move_up', 'move_down', 'move_left', 'move_right', 'pickup', 'drop'] as const;

export type Action = (typeof ACTIONS)[number];

export interface Position {
  readonly x: number;
  readonly y: number;
}

export interface RobotState {
  readonly position: Position;
  readonly carryingBox: boolean;
}

export interface BoxState {
  readonly position: Position;
  readonly isDelivered: boolean;
}

export interface WarehouseRewards {
  readonly step: number;
  readonly closer: number;
  readonly farther: number;
  readonly repeat: number;
  readonly invalid: number;
  readonly pickup: number;
  readonly delivery: number;
  readonly wall: number;
}

export interface WarehouseLayout {
  readonly width: number;
  readonly height: number;
  readonly robotStart: Position;
  readonly boxStart: Position;
  readonly goalPosition: Position;
  readonly walls: readonly Position[];
}

export interface WarehouseEnvironmentOptions {
  readonly layout: WarehouseLayout;
  readonly maxSteps: number;
  readonly rewards: WarehouseRewards;
}

export interface WarehouseState {
  readonly episode: number;
  readonly stepCount: number;
  readonly maxSteps: number;
  readonly done: boolean;
  readonly robot: RobotState;
  readonly box: BoxState;
  readonly goal: Position;
  readonly walls: readonly Position[];
  readonly width: number;
  readonly height: number;
  readonly lastAction?: Action;
  readonly lastReward: number;
  readonly terminalReason?: StepReason;
}

export interface StepResult {
  readonly state: WarehouseState;
  readonly reward: number;
  readonly done: boolean;
  readonly info: StepInfo;
}

export interface StepInfo {
  readonly reason: StepReason;
  readonly valid: boolean;
}

export type StepReason =
  | 'reset'
  | 'moved'
  | 'hit_wall'
  | 'out_of_bounds'
  | 'picked_up_box'
  | 'delivered_box'
  | 'not_at_box'
  | 'not_at_goal'
  | 'not_carrying_box'
  | 'already_delivered'
  | 'max_steps_reached'
  | 'episode_already_done';
