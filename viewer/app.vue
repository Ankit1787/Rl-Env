<script setup lang="ts">
import { storeToRefs } from 'pinia';
import ActionControls from '~/components/ActionControls.vue';
import EnvironmentStats from '~/components/EnvironmentStats.vue';
import WarehouseGrid from '~/components/WarehouseGrid.vue';
import TrainingPanel from '~/components/TrainingPanel.vue';
import { useEnvironmentStore } from '~/stores/environment';

const environment = useEnvironmentStore();
const { canAct, connectionStatus, errorMessage, isLoading, lastStep, state } = storeToRefs(environment);

onMounted(async () => {
  await environment.fetchState();
  environment.connectEvents();
});

onBeforeUnmount(() => {
  environment.disconnectEvents();
});
</script>

<template>
  <main class="min-h-screen p-4 text-zinc-100 md:p-6">
    <div class="mx-auto flex max-w-7xl flex-col gap-4">
      <header class="flex flex-col gap-3 border-b border-white/10 pb-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 class="text-2xl font-semibold">Warehouse RL Control</h1>
          <p class="mt-1 text-sm text-zinc-400">Environment state, actions, rewards, and event stream.</p>
        </div>
        <div
          class="w-fit rounded border border-white/10 px-3 py-1.5 text-xs font-medium uppercase tracking-wide"
          :class="connectionStatus === 'connected' ? 'bg-emerald-500/15 text-emerald-200' : 'bg-zinc-800 text-zinc-300'"
        >
          {{ connectionStatus }}
        </div>
      </header>

      <div v-if="errorMessage" class="rounded border border-rose-400/40 bg-rose-500/10 p-3 text-sm text-rose-100">
        {{ errorMessage }}
      </div>

      <div v-if="state" class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div class="min-w-0">
          <EnvironmentStats :state="state" :last-step="lastStep" :connection-status="connectionStatus" />
          <div class="mt-4">
            <WarehouseGrid :state="state" />
          </div>
        </div>

        <aside class="flex flex-col gap-4">
          <TrainingPanel @configured="environment.fetchState" />
          <ActionControls :disabled="!canAct" @step="environment.step" @reset="environment.reset" />
          <section class="rounded border border-white/10 bg-zinc-900 p-4">
            <p class="text-xs uppercase tracking-wide text-zinc-400">Objects</p>
            <div class="mt-3 grid grid-cols-[64px_1fr] gap-x-3 gap-y-2 text-sm text-zinc-200">
              <span class="text-zinc-500">Robot</span>
              <span class="font-mono">column={{ state.robot.position.x }}, row={{ state.robot.position.y }}</span>
              <span class="text-zinc-500">Box</span>
              <span v-if="state.box.isDelivered" class="font-mono text-emerald-300">Delivered</span>
              <span v-else-if="state.robot.carryingBox" class="font-mono text-amber-300">Carried</span>
              <span v-else class="font-mono">column={{ state.box.position.x }}, row={{ state.box.position.y }}</span>
              <span class="text-zinc-500">Goal</span>
              <span class="font-mono text-emerald-300">column={{ state.goal.x }}, row={{ state.goal.y }}</span>
              <span class="text-zinc-500">State</span>
              <span class="font-mono">{{ state.done ? 'Done' : 'Active' }}</span>
            </div>
          </section>
        </aside>
      </div>

      <div v-else class="rounded border border-white/10 bg-zinc-900 p-6 text-sm text-zinc-300">
        {{ isLoading ? 'Loading environment state...' : 'Environment state is unavailable.' }}
      </div>
    </div>
  </main>
</template>
