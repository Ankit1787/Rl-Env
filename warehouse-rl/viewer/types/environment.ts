export const warehouseActions = [
  'move_up',
  'move_down',
  'move_left',
  'move_right',
  'pickup',
  'drop',
] as const;

export type WarehouseAction = (typeof warehouseActions)[number];

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
  readonly lastAction?: WarehouseAction;
  readonly lastReward: number;
  readonly terminalReason?: string;
}

export interface StepInfo {
  readonly reason: string;
  readonly valid: boolean;
}

export interface StepResult {
  readonly state: WarehouseState;
  readonly reward: number;
  readonly done: boolean;
  readonly info: StepInfo;
}

export type EnvironmentEvent =
  | {
      readonly type: 'state';
      readonly state: WarehouseState;
    }
  | {
      readonly type: 'reset';
      readonly state: WarehouseState;
    }
  | {
      readonly type: 'step';
      readonly result: StepResult;
    };
