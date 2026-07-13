import type { FastifyInstance } from 'fastify';
import type { WebSocketClient, WebSocketEventBroadcaster } from './events.js';
import type { WarehouseEnvironment } from '../domain/warehouseEnvironment.js';

interface EnvironmentWebSocket extends WebSocketClient {
  on(event: 'close', listener: () => void): void;
}

export function registerWebSocketRoutes(
  server: FastifyInstance,
  dependencies: {
    readonly broadcaster: WebSocketEventBroadcaster;
    readonly environment: WarehouseEnvironment;
  },
): void {
  const { broadcaster, environment } = dependencies;

  server.get('/events', { websocket: true }, (socket: EnvironmentWebSocket) => {
    broadcaster.addClient(socket);
    socket.send(
      JSON.stringify({
        type: 'state',
        state: environment.getState(),
      }),
    );
    socket.on('close', () => {
      broadcaster.removeClient(socket);
    });
  });
}
