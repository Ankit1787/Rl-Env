<script setup lang="ts">
import type { StepResult, WarehouseState } from '~/types/environment';

defineProps<{
  state: WarehouseState;
  lastStep: StepResult | null;
  connectionStatus: string;
}>();
</script>

<template>
  <section class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
    <div class="rounded border border-white/10 bg-zinc-900 p-4">
      <p class="text-xs uppercase tracking-wide text-zinc-400">Reward</p>
      <p class="mt-2 text-2xl font-semibold" :class="state.lastReward >= 0 ? 'text-emerald-300' : 'text-rose-300'">
        {{ state.lastReward }}
      </p>
    </div>
    <div class="rounded border border-white/10 bg-zinc-900 p-4">
      <p class="text-xs uppercase tracking-wide text-zinc-400">Episode</p>
      <p class="mt-2 text-2xl font-semibold">{{ state.episode }}</p>
    </div>
    <div class="rounded border border-white/10 bg-zinc-900 p-4">
      <p class="text-xs uppercase tracking-wide text-zinc-400">Steps</p>
      <p class="mt-2 text-2xl font-semibold">{{ state.stepCount }} / {{ state.maxSteps }}</p>
    </div>
    <div class="rounded border border-white/10 bg-zinc-900 p-4">
      <p class="text-xs uppercase tracking-wide text-zinc-400">Socket</p>
      <p class="mt-2 text-base font-medium capitalize">{{ connectionStatus }}</p>
    </div>
  </section>

  <section class="mt-3 grid gap-3 lg:grid-cols-3">
    <div class="rounded border border-white/10 bg-zinc-900 p-4">
      <p class="text-xs uppercase tracking-wide text-zinc-400">Last Action</p>
      <p class="mt-2 font-mono text-sm">{{ state.lastAction ?? 'none' }}</p>
    </div>
    <div class="rounded border border-white/10 bg-zinc-900 p-4">
      <p class="text-xs uppercase tracking-wide text-zinc-400">Last Result</p>
      <p class="mt-2 font-mono text-sm">{{ lastStep?.info.reason ?? state.terminalReason ?? 'ready' }}</p>
    </div>
    <div class="rounded border border-white/10 bg-zinc-900 p-4">
      <p class="text-xs uppercase tracking-wide text-zinc-400">Robot</p>
      <p class="mt-2 font-mono text-sm">
        x={{ state.robot.position.x }}, y={{ state.robot.position.y }},
        {{ state.robot.carryingBox ? 'carrying' : 'empty' }}
      </p>
    </div>
  </section>
</template>
