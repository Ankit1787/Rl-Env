import type { FastifyInstance } from 'fastify';
import { ZodError } from 'zod';
import type { EventBroadcaster } from './events.js';
import { stepRequestSchema } from './schemas.js';
import type { WarehouseEnvironment } from '../domain/warehouseEnvironment.js';

export interface RouteDependencies {
  readonly environment: WarehouseEnvironment;
  readonly broadcaster: EventBroadcaster;
}

export function registerRoutes(
  server: FastifyInstance,
  dependencies: RouteDependencies,
): void {
  const { broadcaster, environment } = dependencies;

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
