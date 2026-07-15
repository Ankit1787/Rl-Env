<script setup lang="ts">
type TrainingState = 'idle' | 'running' | 'completed' | 'failed';

interface TrainingStatus {
  state: TrainingState;
  mode?: 'random' | 'ppo';
  phase?: 'training' | 'evaluating';
  evaluation_episodes?: number;
  error?: string;
  result?: {
    evaluation_episodes: number;
    successful_deliveries: number;
    success_rate: number;
    mean_reward: number;
    mean_steps: number;
    model_path?: string;
  };
}

const emit = defineEmits<{ configured: [] }>();
const config = useRuntimeConfig();
const mode = ref<'random' | 'ppo'>('ppo');
const width = ref(4);
const height = ref(4);
const maxSteps = ref(10);
const robotX = ref(0);
const robotY = ref(0);
const boxX = ref(1);
const boxY = ref(1);
const goalX = ref(3);
const goalY = ref(3);
const randomEpisodes = ref(20);
const randomSeed = ref<number | null>(42);
const ppoTimesteps = ref(10000);
const ppoLearningRate = ref(0.0003);
const ppoRolloutSteps = ref(64);
const ppoBatchSize = ref(32);
const ppoGamma = ref(0.99);
const ppoEvalEpisodes = ref(3);
const status = ref<TrainingStatus>({ state: 'idle' });
const errorMessage = ref<string | null>(null);
let timer: ReturnType<typeof setInterval> | null = null;

const isRunning = computed(() => status.value.state === 'running');
const statusLabel = computed(() => {
  if (status.value.state === 'running' && status.value.phase === 'evaluating') {
    return `Evaluating (${status.value.evaluation_episodes ?? 0} episodes)`;
  }
  if (status.value.state === 'running') return 'Training';
  return status.value.state;
});

function clampPositions(): void {
  const maxX = Math.max(0, width.value - 1);
  const maxY = Math.max(0, height.value - 1);
  robotX.value = Math.min(Math.max(0, robotX.value), maxX);
  boxX.value = Math.min(Math.max(0, boxX.value), maxX);
  goalX.value = Math.min(Math.max(0, goalX.value), maxX);
  robotY.value = Math.min(Math.max(0, robotY.value), maxY);
  boxY.value = Math.min(Math.max(0, boxY.value), maxY);
  goalY.value = Math.min(Math.max(0, goalY.value), maxY);
}

function clampConfiguration(): void {
  width.value = Math.min(Math.max(2, Number(width.value) || 2), 30);
  height.value = Math.min(Math.max(2, Number(height.value) || 2), 30);
  maxSteps.value = Math.min(Math.max(1, Number(maxSteps.value) || 1), 10000);
  goalX.value = width.value - 1;
  goalY.value = height.value - 1;
  clampPositions();
}

watch([width, height], () => {
  goalX.value = Math.max(0, width.value - 1);
  goalY.value = Math.max(0, height.value - 1);
  clampPositions();
});

async function refreshStatus(): Promise<void> {
  try {
    status.value = await $fetch<TrainingStatus>('/training/status', {
      baseURL: config.public.trainerBaseUrl,
    });
    if (status.value.state !== 'running' && timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  } catch {
    status.value = { state: 'idle' };
  }
}

async function startTraining(): Promise<void> {
  errorMessage.value = null;
  width.value = Math.min(Math.max(2, Number(width.value) || 2), 30);
  height.value = Math.min(Math.max(2, Number(height.value) || 2), 30);
  maxSteps.value = Math.min(Math.max(1, Number(maxSteps.value) || 1), 10000);
  clampPositions();
  try {
    status.value = await $fetch<TrainingStatus>('/training/start', {
      baseURL: config.public.trainerBaseUrl,
      method: 'POST',
      body: {
        mode: mode.value,
        width: width.value,
        height: height.value,
        max_steps: maxSteps.value,
        robot_start: { x: robotX.value, y: robotY.value },
        box_start: { x: boxX.value, y: boxY.value },
        goal_position: { x: goalX.value, y: goalY.value },
        random_episodes: randomEpisodes.value,
        random_seed: randomSeed.value,
        ppo_total_timesteps: ppoTimesteps.value,
        ppo_learning_rate: ppoLearningRate.value,
        ppo_n_steps: ppoRolloutSteps.value,
        ppo_batch_size: ppoBatchSize.value,
        ppo_gamma: ppoGamma.value,
        ppo_eval_episodes: ppoEvalEpisodes.value,
      },
    });
    emit('configured');
    timer ??= setInterval(refreshStatus, 1500);
  } catch (error) {
    const apiError = error as { data?: { detail?: string | Array<{ msg?: string }> }; message?: string };
    const detail = apiError.data?.detail;
    errorMessage.value = typeof detail === 'string'
      ? detail
      : Array.isArray(detail)
        ? detail.map((item) => item.msg).filter(Boolean).join(' ')
        : apiError.message ?? 'Could not start training.';
  }
}

onMounted(refreshStatus);
onBeforeUnmount(() => {
  if (timer !== null) clearInterval(timer);
});
</script>

<template>
  <section class="rounded-xl border border-white/10 bg-zinc-900 p-4 shadow-xl shadow-black/10">
    <div class="flex items-start justify-between gap-3">
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">Train from the browser</p>
        <h2 class="mt-1 text-lg font-semibold">Training setup</h2>
      </div>
      <span class="rounded-full px-2.5 py-1 text-xs font-medium capitalize"
        :class="isRunning ? 'bg-amber-400/15 text-amber-200' : status.state === 'completed' ? 'bg-emerald-400/15 text-emerald-200' : status.state === 'failed' ? 'bg-rose-400/15 text-rose-200' : 'bg-white/5 text-zinc-300'">
        {{ statusLabel }}
      </span>
    </div>

    <div class="mt-4 grid grid-cols-2 gap-3">
      <label class="col-span-2 text-xs text-zinc-400">Training mode
        <select v-model="mode" :disabled="isRunning" class="field mt-1">
          <option value="ppo">PPO — learns a policy</option>
          <option value="random">Random — connectivity test</option>
        </select>
      </label>
      <label class="text-xs text-zinc-400">Columns<input v-model.number="width" class="field mt-1" type="number" min="2" max="30" @change="clampConfiguration"></label>
      <label class="text-xs text-zinc-400">Rows<input v-model.number="height" class="field mt-1" type="number" min="2" max="30" @change="clampConfiguration"></label>
      <label class="col-span-2 text-xs text-zinc-400">Max actions per episode<input v-model.number="maxSteps" class="field mt-1" type="number" min="1" max="10000" @change="clampConfiguration"></label>
    </div>

    <details class="mt-4 rounded-lg border border-white/10 bg-black/10 p-3">
      <summary class="cursor-pointer text-sm font-medium text-zinc-200">Object positions</summary>
      <p class="mt-2 text-xs text-zinc-500">Column/X is 0–{{ width - 1 }} from left to right. Row/Y is 0–{{ height - 1 }} from top to bottom.</p>
      <div class="mt-3 grid grid-cols-[1fr_86px_86px] items-center gap-2 text-xs text-zinc-400">
        <span></span><span>Column (X)</span><span>Row (Y)</span>
        <span>Robot</span><input v-model.number="robotX" class="field" type="number" min="0" :max="width - 1" @change="clampPositions"><input v-model.number="robotY" class="field" type="number" min="0" :max="height - 1" @change="clampPositions">
        <span>Box</span><input v-model.number="boxX" class="field" type="number" min="0" :max="width - 1" @change="clampPositions"><input v-model.number="boxY" class="field" type="number" min="0" :max="height - 1" @change="clampPositions">
        <span>Goal</span><input v-model.number="goalX" class="field" type="number" min="0" :max="width - 1" @change="clampPositions"><input v-model.number="goalY" class="field" type="number" min="0" :max="height - 1" @change="clampPositions">
      </div>
    </details>

    <details class="mt-3 rounded-lg border border-white/10 bg-black/10 p-3">
      <summary class="cursor-pointer text-sm font-medium text-zinc-200">{{ mode === 'ppo' ? 'PPO settings' : 'Random settings' }}</summary>
      <div v-if="mode === 'ppo'" class="mt-3 grid grid-cols-2 gap-3">
        <label class="col-span-2 text-xs text-zinc-400">Training timesteps<input v-model.number="ppoTimesteps" class="field mt-1" type="number" min="64"></label>
        <label class="text-xs text-zinc-400">Rollout steps<input v-model.number="ppoRolloutSteps" class="field mt-1" type="number" min="2"></label>
        <label class="text-xs text-zinc-400">Batch size<input v-model.number="ppoBatchSize" class="field mt-1" type="number" min="2"></label>
        <label class="text-xs text-zinc-400">Learning rate<input v-model.number="ppoLearningRate" class="field mt-1" type="number" step="0.0001"></label>
        <label class="text-xs text-zinc-400">Gamma<input v-model.number="ppoGamma" class="field mt-1" type="number" step="0.01" min="0.01" max="1"></label>
        <label class="col-span-2 text-xs text-zinc-400">Evaluation episodes<input v-model.number="ppoEvalEpisodes" class="field mt-1" type="number" min="1"></label>
      </div>
      <div v-else class="mt-3 grid grid-cols-2 gap-3">
        <label class="text-xs text-zinc-400">Episodes<input v-model.number="randomEpisodes" class="field mt-1" type="number" min="1"></label>
        <label class="text-xs text-zinc-400">Seed<input v-model.number="randomSeed" class="field mt-1" type="number"></label>
      </div>
    </details>

    <p v-if="errorMessage || status.error" class="mt-3 text-xs text-rose-300">{{ errorMessage ?? status.error }}</p>
    <p v-if="status.phase === 'evaluating'" class="mt-3 text-xs leading-5 text-amber-200/80">
      Training timesteps are complete. The saved policy is now running evaluation episodes, so the warehouse episode counter will continue until evaluation finishes.
    </p>
    <section v-if="status.state === 'completed' && status.result" class="mt-4 rounded-lg border border-emerald-300/20 bg-emerald-400/5 p-3">
      <p class="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-300">Evaluation results</p>
      <div class="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div class="rounded-md bg-black/20 p-2.5"><p class="text-xs text-zinc-400">Success rate</p><p class="mt-1 font-semibold text-emerald-200">{{ (status.result.success_rate * 100).toFixed(1) }}%</p></div>
        <div class="rounded-md bg-black/20 p-2.5"><p class="text-xs text-zinc-400">Deliveries</p><p class="mt-1 font-semibold">{{ status.result.successful_deliveries }} / {{ status.result.evaluation_episodes }}</p></div>
        <div class="rounded-md bg-black/20 p-2.5"><p class="text-xs text-zinc-400">Average reward</p><p class="mt-1 font-semibold">{{ status.result.mean_reward.toFixed(2) }}</p></div>
        <div class="rounded-md bg-black/20 p-2.5"><p class="text-xs text-zinc-400">Average steps</p><p class="mt-1 font-semibold">{{ status.result.mean_steps.toFixed(1) }}</p></div>
      </div>
    </section>
    <button class="mt-4 w-full rounded-lg bg-emerald-400 px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50" :disabled="isRunning" @click="startTraining">
      {{ isRunning ? 'Training in progress…' : `Start ${mode.toUpperCase()} training` }}
    </button>
  </section>
</template>

<style scoped>
.field {
  width: 100%;
  border: 1px solid rgb(255 255 255 / 0.1);
  border-radius: 0.5rem;
  background: rgb(24 24 27);
  padding: 0.55rem 0.65rem;
  color: rgb(244 244 245);
  outline: none;
}
.field:focus { border-color: rgb(52 211 153 / 0.8); }
</style>
