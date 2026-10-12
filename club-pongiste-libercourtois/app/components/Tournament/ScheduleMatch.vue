<script setup lang="ts">
  import { matchTimeLabel } from '~/utils/tournament-schedule'
  import type { ScheduledMatch } from '~/utils/tournament-schedule'

  const props = withDefaults(
    defineProps<{
      match: ScheduledMatch
      editable: boolean
      seriesId: number
      openableIds: number[]
      compact?: boolean
      continuation?: boolean
    }>(),
    { compact: false, continuation: false }
  )
  const emit = defineEmits<{ open: [id: number] }>()
  const phase = computed(function () {
    if (props.match.phase === 'pools') return `Poule ${props.match.poolId}`
    if (props.match.phase === 'playoffs') return 'Barrage'
    return `Places ${props.match.rangeStart}–${props.match.rangeEnd}`
  })
  const statusLabels = {
    pending: 'À jouer',
    in_progress: 'En cours',
    finished: 'Terminé',
    forfeit: 'Forfait'
  }
  const statusClasses = {
    pending:
      'border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-900',
    in_progress:
      'border-amber-400 bg-amber-50 dark:border-amber-600 dark:bg-amber-950',
    finished:
      'border-emerald-400 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950',
    forfeit: 'border-gray-400 bg-gray-100 dark:border-gray-600 dark:bg-gray-800'
  }
  const startLabel = computed(function () {
    return matchTimeLabel(props.match)
  })
  function open(): void {
    emit('open', props.match.id)
  }
</script>

<template>
  <article
    class="flex gap-3 rounded-lg border border-l-4 p-3 text-sm"
    :class="statusClasses[match.status]"
  >
    <div
      v-if="!compact"
      class="flex w-14 shrink-0 flex-col items-center justify-center rounded-md bg-slate-800 px-1 py-2 text-white dark:bg-slate-700"
    >
      <template v-if="match.tables.length">
        <span class="text-lg font-bold leading-none">{{
          match.tables.join(' · ')
        }}</span>
        <span class="mt-1 text-[10px] uppercase tracking-wide">{{
          match.tables.length > 1 ? 'Tables' : 'Table'
        }}</span>
      </template>
      <span v-else class="text-center text-xs">Sans table</span>
    </div>
    <div class="min-w-0 flex-1 space-y-1.5">
      <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        <span
          class="rounded bg-slate-800 px-1.5 py-0.5 font-semibold text-white dark:bg-slate-700"
          >{{ match.seriesName }}</span
        >
        <span class="text-slate-500 dark:text-slate-400">{{ phase }}</span>
        <span v-if="compact && match.tables.length" class="font-medium">
          {{ match.tables.length > 1 ? 'Tables' : 'Table' }}
          {{ match.tables.join(' et ') }}
        </span>
      </div>
      <p v-if="startLabel" class="text-xs text-slate-500 dark:text-slate-400">
        {{ continuation ? 'Suite · ' : '' }}{{ startLabel }}
      </p>
      <div
        :class="
          compact
            ? 'flex flex-col items-start gap-0.5'
            : 'flex flex-wrap items-center gap-x-2 gap-y-1'
        "
      >
        <span :class="{ 'font-bold': match.winnerSide === 1 }">{{
          match.player1Name
        }}</span>
        <span class="text-xs text-slate-400">{{
          compact ? 'contre' : 'vs'
        }}</span>
        <span :class="{ 'font-bold': match.winnerSide === 2 }">{{
          match.player2Name
        }}</span>
      </div>
      <div class="flex flex-wrap items-center gap-2 text-xs">
        <span
          :class="{
            'font-semibold text-amber-700 dark:text-amber-300':
              match.status === 'in_progress'
          }"
        >
          {{ statusLabels[match.status] }}
        </span>
        <span v-if="match.score" class="font-medium">{{ match.score }}</span>
        <template v-if="editable && !continuation">
          <UButton
            v-if="match.seriesId === seriesId && openableIds.includes(match.id)"
            size="xs"
            variant="soft"
            @click="open"
            >{{
              match.status === 'finished'
                ? 'Corriger'
                : match.status === 'in_progress'
                  ? 'Saisir'
                  : 'Lancer'
            }}</UButton
          >
          <span
            v-else-if="match.seriesId !== seriesId"
            class="text-slate-500 dark:text-slate-400"
          >
            Sélectionner cette série
          </span>
          <span
            v-else-if="match.phase === 'pools' && match.status === 'pending'"
            class="text-slate-500 dark:text-slate-400"
          >
            Lancer depuis Poules
          </span>
        </template>
      </div>
    </div>
  </article>
</template>
