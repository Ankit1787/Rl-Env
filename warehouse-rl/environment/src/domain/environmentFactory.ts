import type { EnvironmentConfig } from '../config.js';
import { WarehouseEnvironment } from './warehouseEnvironment.js';

export function createWarehouseEnvironment(config: EnvironmentConfig): WarehouseEnvironment {
  return new WarehouseEnvironment({
    layout: {
      width: config.gridWidth,
      height: config.gridHeight,
      robotStart: config.robotStart,
      boxStart: config.boxStart,
      goalPosition: config.goalPosition,
      walls: config.walls,
    },
    maxSteps: config.maxSteps,
    rewards: config.rewards,
  });
}
