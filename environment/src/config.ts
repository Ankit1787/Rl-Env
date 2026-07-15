import { z } from 'zod';
import type { Position } from './domain/types.js';

function parsePosition(value: string, fieldName: string): Position {
  const [xValue, yValue] = value.split(',');
  const x = Number(xValue);
  const y = Number(yValue);

  if (!Number.isInteger(x) || !Number.isInteger(y)) {
    throw new Error(`${fieldName} must use "x,y" integer format`);
  }

  return { x, y };
}

function parseWalls(value: string | undefined): Position[] {
  if (value === undefined || value.trim() === '') {
    return [];
  }

  return value.split(';').map((wall, index) => parsePosition(wall, `wall at index ${String(index)}`));
}

const configSchema = z.object({
  port: z.coerce.number().int().positive().default(3001),
  corsOrigin: z.string().optional(),
  gridWidth: z.coerce.number().int().min(2).default(4),
  gridHeight: z.coerce.number().int().min(2).default(4),
  maxSteps: z.coerce.number().int().positive().default(10),
  robotStart: z.string().default('0,0').transform((value) => parsePosition(value, 'robotStart')),
  boxStart: z.string().default('1,1').transform((value) => parsePosition(value, 'boxStart')),
  goalPosition: z.string().default('3,3').transform((value) => parsePosition(value, 'goalPosition')),
  walls: z.string().optional().transform(parseWalls),
  rewards: z.object({
    step: z.coerce.number().default(-1),
    closer: z.coerce.number().default(1),
    farther: z.coerce.number().default(-2),
    repeat: z.coerce.number().default(-3),
    invalid: z.coerce.number().default(-5),
    pickup: z.coerce.number().default(10),
    delivery: z.coerce.number().default(50),
    wall: z.coerce.number().default(-5),
  }),
});

export type EnvironmentConfig = z.infer<typeof configSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): EnvironmentConfig {
  return configSchema.parse({
    port: env.ENVIRONMENT_PORT,
    corsOrigin: env.ENVIRONMENT_CORS_ORIGIN,
    gridWidth: env.WAREHOUSE_GRID_WIDTH,
    gridHeight: env.WAREHOUSE_GRID_HEIGHT,
    maxSteps: env.WAREHOUSE_MAX_STEPS,
    robotStart: env.WAREHOUSE_ROBOT_START,
    boxStart: env.WAREHOUSE_BOX_START,
    goalPosition: env.WAREHOUSE_GOAL_POSITION,
    walls: env.WAREHOUSE_WALLS,
    rewards: {
      step: env.WAREHOUSE_REWARD_STEP,
      closer: env.WAREHOUSE_REWARD_CLOSER,
      farther: env.WAREHOUSE_REWARD_FARTHER,
      repeat: env.WAREHOUSE_REWARD_REPEAT,
      invalid: env.WAREHOUSE_REWARD_INVALID,
      pickup: env.WAREHOUSE_REWARD_PICKUP,
      delivery: env.WAREHOUSE_REWARD_DELIVERY,
      wall: env.WAREHOUSE_REWARD_WALL,
    },
  });
}
