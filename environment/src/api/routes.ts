import type { FastifyInstance } from 'fastify';
import { ZodError } from 'zod';
import type { EventBroadcaster } from './events.js';
import { configureRequestSchema, stepRequestSchema } from './schemas.js';
import type { WarehouseRewards } from '../domain/types.js';
import type { WarehouseEnvironment } from '../domain/warehouseEnvironment.js';

export interface RouteDependencies {
  readonly environment: WarehouseEnvironment;
  readonly broadcaster: EventBroadcaster;
  readonly rewards: WarehouseRewards;
}

export function registerRoutes(
  server: FastifyInstance,
  dependencies: RouteDependencies,
): void {
  const { broadcaster, environment, rewards } = dependencies;

  server.get('/health', () => ({
    status: 'ok',
    service: 'environment',
  }));

  server.get('/state', () => ({
    state: environment.getState(),
  }));

  server.post('/reset', () => {
    const state = environment.reset();
    broadcaster.publish({
      type: 'reset',
      state,
    });

    return {
      state,
    };
  });

  server.post('/configure', (request, reply) => {
    try {
      const body = configureRequestSchema.parse(request.body);
      const state = environment.configure({
        layout: body,
        maxSteps: body.maxSteps,
        rewards,
      });
      broadcaster.publish({ type: 'reset', state });
      return { state };
    } catch (error) {
      if (error instanceof ZodError || error instanceof Error) {
        return reply.status(400).send({
          error: 'invalid_configuration',
          message: error.message,
        });
      }
      throw error;
    }
  });

  server.post('/step', (request, reply) => {
    try {
      const body = stepRequestSchema.parse(request.body);
      const result = environment.step(body.action);

      broadcaster.publish({
        type: 'step',
        result,
      });

      return result;
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.status(400).send({
          error: 'invalid_request',
          message: 'Request body must include a supported action.',
          details: error.issues,
        });
      }

      throw error;
    }
  });
}
