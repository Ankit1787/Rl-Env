<script setup lang="ts">
import type { WarehouseAction } from '~/types/environment';

defineProps<{
  disabled: boolean;
}>();

const emit = defineEmits<{
  step: [action: WarehouseAction];
  reset: [];
}>();

const moveUp = { action: 'move_up', icon: '↑' } satisfies { action: WarehouseAction; icon: string };
const moveLeft = { action: 'move_left', icon: '←' } satisfies { action: WarehouseAction; icon: string };
const moveRight = { action: 'move_right', icon: '→' } satisfies { action: WarehouseAction; icon: string };
const moveDown = { action: 'move_down', icon: '↓' } satisfies { action: WarehouseAction; icon: string };
</script>

<template>
  <section class="rounded border border-white/10 bg-zinc-900 p-4">
    <div class="grid grid-cols-3 gap-2">
      <button
        class="col-start-2 flex h-12 items-center justify-center rounded border border-white/10 bg-zinc-800 text-xl hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="disabled"
        title="Move up"
        @click="emit('step', moveUp.action)"
      >
        {{ moveUp.icon }}
      </button>
      <button
        class="col-start-1 row-start-2 flex h-12 items-center justify-center rounded border border-white/10 bg-zinc-800 text-xl hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="disabled"
        title="Move left"
        @click="emit('step', moveLeft.action)"
      >
        {{ moveLeft.icon }}
      </button>
      <button
        class="col-start-3 row-start-2 flex h-12 items-center justify-center rounded border border-white/10 bg-zinc-800 text-xl hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="disabled"
        title="Move right"
        @click="emit('step', moveRight.action)"
      >
        {{ moveRight.icon }}
      </button>
      <button
        class="col-start-2 row-start-3 flex h-12 items-center justify-center rounded border border-white/10 bg-zinc-800 text-xl hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="disabled"
        title="Move down"
        @click="emit('step', moveDown.action)"
      >
        {{ moveDown.icon }}
      </button>
    </div>

    <div class="mt-4 grid grid-cols-2 gap-2">
      <button
        class="h-11 rounded border border-amber-300/40 bg-amber-500/20 text-sm font-medium text-amber-100 hover:bg-amber-500/30 disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="disabled"
        @click="emit('step', 'pickup')"
      >
        Pick up
      </button>
      <button
        class="h-11 rounded border border-emerald-300/40 bg-emerald-500/20 text-sm font-medium text-emerald-100 hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="disabled"
        @click="emit('step', 'drop')"
      >
        Drop
      </button>
    </div>

    <button
      class="mt-4 h-11 w-full rounded border border-white/10 bg-white text-sm font-semibold text-zinc-950 hover:bg-zinc-200"
      @click="emit('reset')"
    >
      Reset Episode
    </button>
  </section>
</template>
