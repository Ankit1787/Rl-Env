import { describe, expect, it } from 'vitest';
import { parseAction } from '../src/domain/action.js';
import { WarehouseEnvironment } from '../src/domain/warehouseEnvironment.js';
import type { WarehouseEnvironmentOptions } from '../src/domain/types.js';

function createOptions(overrides: Partial<WarehouseEnvironmentOptions> = {}): WarehouseEnvironmentOptions {
  return {
    layout: {
      width: 5,
      height: 5,
      robotStart: { x: 0, y: 0 },
      boxStart: { x: 1, y: 0 },
      goalPosition: { x: 4, y: 4 },
      walls: [{ x: 2, y: 0 }],
      ...overrides.layout,
    },
    maxSteps: overrides.maxSteps ?? 20,
    rewards: {
      step: -1,
      invalid: -5,
      pickup: 10,
      delivery: 50,
      wall: -7,
      ...overrides.rewards,
    },
  };
}

describe('WarehouseEnvironment', () => {
  it('resets to the configured initial world state', () => {
    const environment = new WarehouseEnvironment(createOptions());
    const state = environment.reset();

    expect(state.episode).toBe(1);
    expect(state.stepCount).toBe(0);
    expect(state.robot.position).toEqual({ x: 0, y: 0 });
    expect(state.robot.carryingBox).toBe(false);
    expect(state.box.position).toEqual({ x: 1, y: 0 });
    expect(state.box.isDelivered).toBe(false);
  });

  it('moves the robot through walkable cells', () => {
    const environment = new WarehouseEnvironment(createOptions());
    environment.reset();

    const result = environment.step('move_down');

    expect(result.state.robot.position).toEqual({ x: 0, y: 1 });
    expect(result.reward).toBe(-1);
    expect(result.done).toBe(false);
    expect(result.info).toEqual({ reason: 'moved', valid: true });
  });

  it('rejects moves outside the grid', () => {
    const environment = new WarehouseEnvironment(createOptions());
    environment.reset();

    const result = environment.step('move_left');

    expect(result.state.robot.position).toEqual({ x: 0, y: 0 });
    expect(result.reward).toBe(-5);
    expect(result.info).toEqual({ reason: 'out_of_bounds', valid: false });
  });

  it('rejects moves into walls with the wall reward', () => {
    const environment = new WarehouseEnvironment(createOptions());
    environment.reset();

    environment.step('move_right');
    const result = environment.step('move_right');

    expect(result.state.robot.position).toEqual({ x: 1, y: 0 });
    expect(result.reward).toBe(-7);
    expect(result.info).toEqual({ reason: 'hit_wall', valid: false });
  });

  it('allows the robot to pick up the box when standing on it', () => {
    const environment = new WarehouseEnvironment(createOptions());
    environment.reset();

    environment.step('move_right');
    const result = environment.step('pickup');

    expect(result.state.robot.carryingBox).toBe(true);
    expect(result.reward).toBe(10);
    expect(result.info).toEqual({ reason: 'picked_up_box', valid: true });
  });

  it('moves the box with the robot while carrying it', () => {
    const environment = new WarehouseEnvironment(
      createOptions({
        layout: {
          width: 5,
          height: 5,
          robotStart: { x: 0, y: 0 },
          boxStart: { x: 1, y: 0 },
          goalPosition: { x: 4, y: 4 },
          walls: [],
        },
      }),
    );
    environment.reset();

    environment.step('move_right');
    environment.step('pickup');
    const result = environment.step('move_down');

    expect(result.state.robot.position).toEqual({ x: 1, y: 1 });
    expect(result.state.box.position).toEqual({ x: 1, y: 1 });
  });

  it('delivers the box when dropped on the goal', () => {
    const environment = new WarehouseEnvironment(
      createOptions({
        layout: {
          width: 3,
          height: 2,
          robotStart: { x: 0, y: 0 },
          boxStart: { x: 1, y: 0 },
          goalPosition: { x: 2, y: 0 },
          walls: [],
        },
      }),
    );
    environment.reset();

    environment.step('move_right');
    environment.step('pickup');
    environment.step('move_right');
    const result = environment.step('drop');

    expect(result.state.box.isDelivered).toBe(true);
    expect(result.state.robot.carryingBox).toBe(false);
    expect(result.reward).toBe(50);
    expect(result.done).toBe(true);
    expect(result.info).toEqual({ reason: 'delivered_box', valid: true });
  });

  it('penalizes pickup attempts when the robot is not at the box', () => {
    const environment = new WarehouseEnvironment(createOptions());
    environment.reset();

    const result = environment.step('pickup');

    expect(result.reward).toBe(-5);
    expect(result.info).toEqual({ reason: 'not_at_box', valid: false });
  });

  it('ends the episode when max steps are reached', () => {
    const environment = new WarehouseEnvironment(
      createOptions({
        maxSteps: 1,
      }),
    );
    environment.reset();

    const result = environment.step('move_down');

    expect(result.done).toBe(true);
    expect(result.reward).toBe(-5);
    expect(result.info).toEqual({ reason: 'max_steps_reached', valid: true });
    expect(result.state.terminalReason).toBe('max_steps_reached');
  });
});

describe('parseAction', () => {
  it('returns known actions', () => {
    expect(parseAction('move_right')).toBe('move_right');
  });

  it('throws for unsupported actions', () => {
    expect(() => parseAction('teleport')).toThrow('Unsupported warehouse action');
  });
});
