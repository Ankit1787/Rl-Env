<script setup lang="ts">
import type { Position, WarehouseState } from '~/types/environment';
import { positionKey, positionsEqual } from '~/utils/positions';

const props = defineProps<{
  state: WarehouseState;
}>();

const wallKeys = computed(() => new Set(props.state.walls.map(positionKey)));

function cellAt(x: number, y: number): Position {
  return { x, y };
}

function getCellClasses(position: Position): string[] {
  const classes = ['border', 'border-white/10', 'transition-colors'];

  if (wallKeys.value.has(positionKey(position))) {
    classes.push('bg-zinc-800');
  } else if (positionsEqual(position, props.state.goal)) {
    classes.push('bg-emerald-900/70');
  } else {
    classes.push('bg-zinc-950');
  }

  if (positionsEqual(position, props.state.robot.position)) {
    classes.push('ring-2', 'ring-sky-300', 'ring-inset');
  }

  return classes;
}

function cellLabel(position: Position): string {
  if (wallKeys.value.has(positionKey(position))) {
    return 'Wall';
  }

  if (positionsEqual(position, props.state.robot.position)) {
    return props.state.robot.carryingBox ? 'Robot carrying box' : 'Robot';
  }

  if (!props.state.box.isDelivered && positionsEqual(position, props.state.box.position)) {
    return 'Box';
  }

  if (positionsEqual(position, props.state.goal)) {
    return 'Goal';
  }

  return 'Open cell';
}
</script>

<template>
  <section class="min-w-0">
    <div
      class="grid w-full max-w-[680px] overflow-hidden rounded border border-white/10 bg-black shadow-xl"
      :style="{
        gridTemplateColumns: `repeat(${state.width}, minmax(0, 1fr))`,
        aspectRatio: `${state.width} / ${state.height}`,
      }"
    >
      <div
        v-for="cell in state.width * state.height"
        :key="cell"
        class="relative flex min-h-10 items-center justify-center"
        :class="getCellClasses(cellAt((cell - 1) % state.width, Math.floor((cell - 1) / state.width)))"
        :title="cellLabel(cellAt((cell - 1) % state.width, Math.floor((cell - 1) / state.width)))"
      >
        <span
          v-if="
            positionsEqual(
              cellAt((cell - 1) % state.width, Math.floor((cell - 1) / state.width)),
              state.goal,
            )
          "
          class="absolute right-1 top-1 z-10 flex h-5 w-5 items-center justify-center rounded bg-emerald-400 text-[10px] font-bold text-emerald-950 shadow"
        >G</span>
        <span
          v-if="
            !state.box.isDelivered &&
            !state.robot.carryingBox &&
            positionsEqual(
              cellAt((cell - 1) % state.width, Math.floor((cell - 1) / state.width)),
              state.box.position,
            )
          "
          class="h-5 w-5 rounded-sm border border-amber-200 bg-amber-400 shadow"
        />
        <span
          v-if="
            positionsEqual(
              cellAt((cell - 1) % state.width, Math.floor((cell - 1) / state.width)),
              state.robot.position,
            )
          "
          class="absolute h-6 w-6 rounded-full border border-sky-100 bg-sky-400 shadow"
        >
          <span
            v-if="state.robot.carryingBox"
            class="absolute -right-1 -top-1 h-3 w-3 rounded-sm border border-amber-100 bg-amber-300"
          />
        </span>
      </div>
    </div>
  </section>
</template>
