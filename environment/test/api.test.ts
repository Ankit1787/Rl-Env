import { describe, expect, it } from 'vitest';
import { WebSocketEventBroadcaster, type EnvironmentEvent } from '../src/api/events.js';
import { createApp } from '../src/app.js';
import type { EnvironmentConfig } from '../src/config.js';
import { createWarehouseEnvironment } from '../src/domain/environmentFactory.js';

function createTestConfig(): EnvironmentConfig {
  return {
    port: 3001,
    gridWidth: 4,
    gridHeight: 4,
    maxSteps: 20,
    robotStart: { x: 0, y: 0 },
    boxStart: { x: 1, y: 0 },
    goalPosition: { x: 3, y: 0 },
    walls: [{ x: 0, y: 1 }],
    rewards: {
      step: -1,
      invalid: -5,
      pickup: 10,
      delivery: 50,
      wall: -7,
    },
  };
}

async function createTestApp() {
  const config = createTestConfig();
  const app = await createApp({
    config,
    environment: createWarehouseEnvironment(config),
  });

  return app;
}

describe('environment API', () => {
  it('returns health status', async () => {
    const app = await createTestApp();

    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      status: 'ok',
      service: 'environment',
    });

    await app.close();
  });

  it('returns current state', async () => {
    const app = await createTestApp();

    const response = await app.inject({
      method: 'GET',
      url: '/state',
    });
    const body = response.json<{ state: { robot: { position: { x: number; y: number } } } }>();

    expect(response.statusCode).toBe(200);
    expect(body.state.robot.position).toEqual({ x: 0, y: 0 });

    await app.close();
  });

  it('resets the environment', async () => {
    const app = await createTestApp();

    await app.inject({
      method: 'POST',
      url: '/step',
      payload: {
        action: 'move_right',
      },
    });
    const response = await app.inject({
      method: 'POST',
      url: '/reset',
    });
    const body = response.json<{ state: { episode: number; stepCount: number } }>();

    expect(response.statusCode).toBe(200);
    expect(body.state.episode).toBe(1);
    expect(body.state.stepCount).toBe(0);

    await app.close();
  });

  it('steps the environment with a valid action', async () => {
    const app = await createTestApp();

    const response = await app.inject({
      method: 'POST',
      url: '/step',
      payload: {
        action: 'move_right',
      },
    });
    const body = response.json<{
      state: { robot: { position: { x: number; y: number } } };
      reward: number;
      done: boolean;
      info: { reason: string; valid: boolean };
    }>();

    expect(response.statusCode).toBe(200);
    expect(body.state.robot.position).toEqual({ x: 1, y: 0 });
    expect(body.reward).toBe(-1);
    expect(body.done).toBe(false);
    expect(body.info).toEqual({ reason: 'moved', valid: true });

    await app.close();
  });

  it('rejects unsupported actions with a 400', async () => {
    const app = await createTestApp();

    const response = await app.inject({
      method: 'POST',
      url: '/step',
      payload: {
        action: 'teleport',
      },
    });
    const body = response.json<{ error: string; message: string }>();

    expect(response.statusCode).toBe(400);
    expect(body.error).toBe('invalid_request');

    await app.close();
  });

  it('can complete an episode through the API', async () => {
    const app = await createTestApp();

    await app.inject({ method: 'POST', url: '/step', payload: { action: 'move_right' } });
    await app.inject({ method: 'POST', url: '/step', payload: { action: 'pickup' } });
    await app.inject({ method: 'POST', url: '/step', payload: { action: 'move_right' } });
    await app.inject({ method: 'POST', url: '/step', payload: { action: 'move_right' } });
    const response = await app.inject({
      method: 'POST',
      url: '/step',
      payload: {
        action: 'drop',
      },
    });
    const body = response.json<{ done: boolean; reward: number; info: { reason: string } }>();

    expect(response.statusCode).toBe(200);
    expect(body.done).toBe(true);
    expect(body.reward).toBe(50);
    expect(body.info.reason).toBe('delivered_box');

    await app.close();
  });
});

describe('WebSocketEventBroadcaster', () => {
  it('publishes JSON events to open clients', () => {
    const broadcaster = new WebSocketEventBroadcaster();
    const sentPayloads: string[] = [];
    const client = {
      readyState: 1,
      send(payload: string): void {
        sentPayloads.push(payload);
      },
    };
    const event: EnvironmentEvent = {
      type: 'state',
      state: createWarehouseEnvironment(createTestConfig()).getState(),
    };

    broadcaster.addClient(client);
    broadcaster.publish(event);

    expect(sentPayloads).toHaveLength(1);
    expect(JSON.parse(sentPayloads[0] ?? '{}')).toEqual(event);
  });
});
