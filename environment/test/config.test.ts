import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config.js';

describe('loadConfig', () => {
  it('loads defaults when environment values are absent', () => {
    const config = loadConfig({});

    expect(config.port).toBe(3001);
    expect(config.corsOrigin).toBeUndefined();
    expect(config.gridWidth).toBe(8);
    expect(config.gridHeight).toBe(8);
    expect(config.maxSteps).toBe(100);
    expect(config.robotStart).toEqual({ x: 0, y: 0 });
    expect(config.boxStart).toEqual({ x: 2, y: 2 });
    expect(config.goalPosition).toEqual({ x: 7, y: 7 });
    expect(config.walls).toEqual([]);
    expect(config.rewards.delivery).toBe(50);
  });

  it('loads configured values from environment variables', () => {
    const config = loadConfig({
      ENVIRONMENT_PORT: '4001',
      ENVIRONMENT_CORS_ORIGIN: 'https://warehouse-rl-viewer.onrender.com',
      WAREHOUSE_GRID_WIDTH: '12',
      WAREHOUSE_GRID_HEIGHT: '10',
      WAREHOUSE_MAX_STEPS: '250',
      WAREHOUSE_ROBOT_START: '1,2',
      WAREHOUSE_BOX_START: '3,4',
      WAREHOUSE_GOAL_POSITION: '9,8',
      WAREHOUSE_WALLS: '1,1;2,2',
      WAREHOUSE_REWARD_STEP: '-2',
      WAREHOUSE_REWARD_INVALID: '-8',
      WAREHOUSE_REWARD_PICKUP: '15',
      WAREHOUSE_REWARD_DELIVERY: '80',
      WAREHOUSE_REWARD_WALL: '-12',
    });

    expect(config.port).toBe(4001);
    expect(config.corsOrigin).toBe('https://warehouse-rl-viewer.onrender.com');
    expect(config.gridWidth).toBe(12);
    expect(config.gridHeight).toBe(10);
    expect(config.maxSteps).toBe(250);
    expect(config.robotStart).toEqual({ x: 1, y: 2 });
    expect(config.boxStart).toEqual({ x: 3, y: 4 });
    expect(config.goalPosition).toEqual({ x: 9, y: 8 });
    expect(config.walls).toEqual([
      { x: 1, y: 1 },
      { x: 2, y: 2 },
    ]);
    expect(config.rewards).toEqual({
      step: -2,
      invalid: -8,
      pickup: 15,
      delivery: 80,
      wall: -12,
    });
  });
});
