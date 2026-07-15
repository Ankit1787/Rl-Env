import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import Fastify, { type FastifyInstance } from 'fastify';
import { WebSocketEventBroadcaster } from './api/events.js';
import { registerRoutes } from './api/routes.js';
import { registerWebSocketRoutes } from './api/websocket.js';
import type { EnvironmentConfig } from './config.js';
import { createWarehouseEnvironment } from './domain/environmentFactory.js';
import type { WarehouseEnvironment } from './domain/warehouseEnvironment.js';

export interface AppDependencies {
  readonly config: EnvironmentConfig;
  readonly environment?: WarehouseEnvironment;
  readonly broadcaster?: WebSocketEventBroadcaster;
  readonly logger?: boolean;
}

export async function createApp(dependencies: AppDependencies): Promise<FastifyInstance> {
  const server = Fastify({
    logger: dependencies.logger ?? false,
  });
  const environment = dependencies.environment ?? createWarehouseEnvironment(dependencies.config);
  const broadcaster = dependencies.broadcaster ?? new WebSocketEventBroadcaster();

  await server.register(cors, {
    origin: dependencies.config.corsOrigin ?? true,
  });
  await server.register(websocket);
  registerRoutes(server, {
    environment,
    broadcaster,
    rewards: dependencies.config.rewards,
  });
  registerWebSocketRoutes(server, {
    environment,
    broadcaster,
  });

  return server;
}
