import type { StepResult, WarehouseState } from '../domain/types.js';

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

export interface EventBroadcaster {
  readonly clientCount: number;
  publish(event: EnvironmentEvent): void;
}

export interface WebSocketClient {
  readonly readyState: number;
  send(payload: string): void;
}

const websocketOpenState = 1;

export class WebSocketEventBroadcaster implements EventBroadcaster {
  private readonly clients = new Set<WebSocketClient>();

  get clientCount(): number {
    return this.clients.size;
  }

  addClient(client: WebSocketClient): void {
    this.clients.add(client);
  }

  removeClient(client: WebSocketClient): void {
    this.clients.delete(client);
  }

  publish(event: EnvironmentEvent): void {
    const payload = JSON.stringify(event);

    for (const client of this.clients) {
      if (client.readyState === websocketOpenState) {
        client.send(payload);
      }
    }
  }
}
