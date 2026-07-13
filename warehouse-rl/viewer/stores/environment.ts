import { defineStore } from 'pinia';
import type {
  EnvironmentEvent,
  StepResult,
  WarehouseAction,
  WarehouseState,
} from '~/types/environment';

interface EnvironmentStoreState {
  state: WarehouseState | null;
  lastStep: StepResult | null;
  isLoading: boolean;
  errorMessage: string | null;
  connectionStatus: 'disconnected' | 'connecting' | 'connected';
  socket: WebSocket | null;
}

function toWebSocketUrl(baseUrl: string): string {
  const url = new URL(baseUrl);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = '/events';
  return url.toString();
}

export const useEnvironmentStore = defineStore('environment', {
  state: (): EnvironmentStoreState => ({
    state: null,
    lastStep: null,
    isLoading: false,
    errorMessage: null,
    connectionStatus: 'disconnected',
    socket: null,
  }),

  getters: {
    canAct(currentState): boolean {
      return currentState.state !== null && !currentState.state.done && !currentState.isLoading;
    },
  },

  actions: {
    async fetchState(): Promise<void> {
      const config = useRuntimeConfig();
      this.isLoading = true;
      this.errorMessage = null;

      try {
        const response = await $fetch<{ state: WarehouseState }>('/state', {
          baseURL: config.public.environmentBaseUrl,
        });
        this.state = response.state;
      } catch (error) {
        this.errorMessage = error instanceof Error ? error.message : 'Failed to load environment state.';
      } finally {
        this.isLoading = false;
      }
    },

    async reset(): Promise<void> {
      const config = useRuntimeConfig();
      this.isLoading = true;
      this.errorMessage = null;

      try {
        const response = await $fetch<{ state: WarehouseState }>('/reset', {
          baseURL: config.public.environmentBaseUrl,
          method: 'POST',
        });
        this.state = response.state;
        this.lastStep = null;
      } catch (error) {
        this.errorMessage = error instanceof Error ? error.message : 'Failed to reset environment.';
      } finally {
        this.isLoading = false;
      }
    },

    async step(action: WarehouseAction): Promise<void> {
      const config = useRuntimeConfig();
      this.isLoading = true;
      this.errorMessage = null;

      try {
        const result = await $fetch<StepResult>('/step', {
          baseURL: config.public.environmentBaseUrl,
          method: 'POST',
          body: {
            action,
          },
        });
        this.state = result.state;
        this.lastStep = result;
      } catch (error) {
        this.errorMessage = error instanceof Error ? error.message : 'Failed to step environment.';
      } finally {
        this.isLoading = false;
      }
    },

    connectEvents(): void {
      if (!import.meta.client || this.socket !== null) {
        return;
      }

      const config = useRuntimeConfig();
      const socket = new WebSocket(toWebSocketUrl(config.public.environmentBaseUrl));
      this.socket = socket;
      this.connectionStatus = 'connecting';

      socket.addEventListener('open', () => {
        this.connectionStatus = 'connected';
      });

      socket.addEventListener('message', (message) => {
        const event = JSON.parse(String(message.data)) as EnvironmentEvent;
        this.applyEvent(event);
      });

      socket.addEventListener('close', () => {
        this.connectionStatus = 'disconnected';
        this.socket = null;
      });

      socket.addEventListener('error', () => {
        this.connectionStatus = 'disconnected';
      });
    },

    disconnectEvents(): void {
      this.socket?.close();
      this.socket = null;
      this.connectionStatus = 'disconnected';
    },

    applyEvent(event: EnvironmentEvent): void {
      if (event.type === 'step') {
        this.lastStep = event.result;
        this.state = event.result.state;
        return;
      }

      this.state = event.state;

      if (event.type === 'reset') {
        this.lastStep = null;
      }
    },
  },
});
