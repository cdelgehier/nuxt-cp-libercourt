<script setup lang="ts">
  import type { TournamentSeries } from '~~/server/domains/tournament/types'

  defineProps<{
    series: Array<TournamentSeries & { registrationCount: number }>
    modelValue: number | null
  }>()

  defineEmits<{ 'update:modelValue': [id: number] }>()
</script>

<template>
  <div
    class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
  >
    <button
      v-for="s in series"
      :key="s.id"
      class="text-left rounded-xl border p-4 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
      :class="
        modelValue === s.id
          ? 'border-slate-900 bg-white text-slate-900 ring-1 ring-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
          : 'border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50 dark:bg-slate-900'
      "
      :aria-pressed="modelValue === s.id"
      @click="$emit('update:modelValue', s.id)"
    >
      <div
        class="flex items-center justify-between gap-2 font-semibold text-base leading-tight mb-3"
      >
        <span>{{ s.name }}</span>
        <UIcon
          v-if="modelValue === s.id"
          name="i-heroicons-check-circle"
          class="size-5 text-club-green shrink-0"
        />
      </div>
      <div class="flex items-center gap-1 flex-wrap mb-1.5">
        <TournamentSeriesStatusBadge :status="s.status" />
        <TournamentSeriesTypeBadge
          :type="s.seriesType"
          :points-limit-min="s.pointsLimitMin"
          :points-limit-max="s.pointsLimitMax"
        />
      </div>
      <div class="text-sm text-slate-500">
        {{ s.registrationCount }}
        {{
          s.seriesFormat === 'doubles'
            ? s.registrationCount === 1
              ? 'paire'
              : 'paires'
            : s.registrationCount === 1
              ? 'joueur'
              : 'joueurs'
        }}
        <span v-if="s.femalesOnly"> · Féminines</span>
        <span v-if="s.startTime"> · {{ s.startTime.slice(0, 5) }}</span>
      </div>
    </button>
  </div>
</template>
