<script setup lang="ts">
  import {
    filterSchedule,
    groupSchedule,
    scheduleGrid
  } from '~/utils/tournament-schedule'
  import type {
    ScheduledMatch,
    ScheduledPool,
    ScheduleGroup
  } from '~/utils/tournament-schedule'

  const props = defineProps<{
    matches: ScheduledMatch[]
    pools: ScheduledPool[]
    tableCount: number
    search: string
    editable: boolean
    seriesId: number
    seriesName: string
    title: string
    openableIds: number[]
  }>()
  const emit = defineEmits<{ open: [id: number] }>()
  const view = ref('times')
  const selectedSeries = defineModel<string>('selectedSeries', {
    required: true
  })
  const selectedTime = ref('')
  const upcoming = ref(true)
  const series = computed(function () {
    const names = new Map<number, string>([[props.seriesId, props.seriesName]])
    for (const match of props.matches)
      names.set(match.seriesId, match.seriesName)
    return [...names.entries()].sort(function (first, second) {
      return first[1].localeCompare(second[1], 'fr')
    })
  })
  const availableTimes = computed(function () {
    return groupSchedule(
      filterSchedule(props.matches, {
        seriesId: Number(selectedSeries.value),
        search: props.search,
        upcoming: upcoming.value
      })
    )
  })
  const filtered = computed(function () {
    return filterSchedule(props.matches, {
      seriesId: Number(selectedSeries.value),
      time: selectedTime.value,
      search: props.search,
      upcoming: upcoming.value
    })
  })
  const groups = computed(function () {
    return groupSchedule(filtered.value)
  })
  const grid = computed(function () {
    return scheduleGrid(
      props.matches,
      props.tableCount,
      {
        seriesId: Number(selectedSeries.value),
        time: selectedTime.value,
        search: props.search,
        upcoming: upcoming.value
      },
      props.pools
    )
  })
  const counts = computed(function () {
    const totals = { pending: 0, in_progress: 0, finished: 0, forfeit: 0 }
    for (const match of filtered.value) totals[match.status]++
    return totals
  })
  const reservedPools = computed(function () {
    return props.pools.filter(function (pool) {
      return pool.tables.length > 0
    })
  })

  watch(availableTimes, function (times) {
    if (
      selectedTime.value &&
      !times.some(function (group) {
        return group.key === selectedTime.value
      })
    )
      selectedTime.value = ''
  })
  watch(series, function (options) {
    if (
      selectedSeries.value &&
      !options.some(function (entry) {
        return entry[0] === Number(selectedSeries.value)
      })
    )
      selectedSeries.value = String(props.seriesId)
  })
  function timeOption(group: ScheduleGroup): string {
    return group.dateLabel
      ? `${group.timeLabel} · ${group.dateLabel}`
      : group.timeLabel
  }
  function open(id: number): void {
    emit('open', id)
  }
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h2 class="text-lg font-bold">{{ title }}</h2>
      <div
        class="flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800"
        aria-label="Vue du planning"
      >
        <UButton
          icon="i-heroicons-clock"
          color="neutral"
          :variant="view === 'times' ? 'solid' : 'ghost'"
          :aria-pressed="view === 'times'"
          @click="view = 'times'"
          >Par horaire</UButton
        >
        <UButton
          icon="i-heroicons-table-cells"
          color="neutral"
          :variant="view === 'tables' ? 'solid' : 'ghost'"
          :aria-pressed="view === 'tables'"
          @click="view = 'tables'"
          >Occupation des tables</UButton
        >
      </div>
    </div>
    <div class="flex flex-wrap items-end gap-4">
      <label class="space-y-1 text-sm font-medium">
        <span class="block">Série</span>
        <select
          v-model="selectedSeries"
          class="w-56 rounded-md border border-slate-300 bg-white p-2 dark:border-slate-600 dark:bg-slate-900"
        >
          <option value="">Toutes les séries</option>
          <option v-for="[id, name] in series" :key="id" :value="String(id)">
            {{ name }}
          </option>
        </select>
      </label>
      <label class="space-y-1 text-sm font-medium">
        <span class="block">Horaire</span>
        <select
          v-model="selectedTime"
          class="max-w-full rounded-md border border-slate-300 bg-white p-2 dark:border-slate-600 dark:bg-slate-900"
        >
          <option value="">Tous les horaires</option>
          <option
            v-for="group in availableTimes"
            :key="group.key"
            :value="group.key"
          >
            {{ timeOption(group) }}
          </option>
        </select>
      </label>
      <label class="flex items-center gap-2 pb-2 text-sm">
        <input
          v-model="upcoming"
          type="checkbox"
          class="h-4 w-4 accent-blue-600"
        />
        À venir seulement
      </label>
    </div>
    <div
      class="flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-600 dark:text-slate-300"
      aria-label="État des matchs affichés"
    >
      <span class="flex items-center gap-1.5"
        ><span class="h-2 w-2 rounded-full bg-slate-400" />{{
          counts.pending
        }}
        à jouer</span
      >
      <span class="flex items-center gap-1.5"
        ><span class="h-2 w-2 rounded-full bg-amber-400" />{{
          counts.in_progress
        }}
        en cours</span
      >
      <span class="flex items-center gap-1.5"
        ><span class="h-2 w-2 rounded-full bg-emerald-400" />{{
          counts.finished
        }}
        terminé{{ counts.finished > 1 ? 's' : '' }}</span
      >
      <span v-if="counts.forfeit" class="flex items-center gap-1.5"
        ><span class="h-2 w-2 rounded-full bg-gray-500" />{{
          counts.forfeit
        }}
        forfaits</span
      >
    </div>
    <section
      v-if="reservedPools.length"
      class="space-y-2"
      aria-label="Tables des poules"
    >
      <h3 class="text-sm font-semibold">Tables des poules</h3>
      <div class="flex flex-wrap gap-2">
        <p
          v-for="pool in reservedPools"
          :key="`${pool.seriesId}:${pool.poolId}`"
          class="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-950 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100"
        >
          <strong
            >{{ pool.tables.length > 1 ? 'Tables' : 'Table' }}
            {{ pool.tables.join(' et ') }}</strong
          >
          · {{ pool.seriesName }} · Poule {{ pool.poolId }}
          <span class="ml-2 text-xs">{{
            pool.status === 'in_progress'
              ? 'En cours'
              : pool.tables.length > 1
                ? 'Réservées'
                : 'Réservée'
          }}</span>
        </p>
      </div>
    </section>
    <p
      v-if="!filtered.length"
      class="rounded-lg bg-slate-50 p-8 text-center text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400"
    >
      {{
        matches.length
          ? 'Aucun match ne correspond aux filtres.'
          : 'Les rencontres apparaîtront après la génération des poules.'
      }}
    </p>
    <div v-else-if="view === 'times'" class="mx-auto max-w-5xl space-y-5">
      <section v-for="group in groups" :key="group.key" class="space-y-2">
        <header
          class="flex flex-wrap items-center justify-between gap-2 rounded-md border-l-4 border-blue-700 bg-slate-100 px-3 py-2 dark:bg-slate-800"
        >
          <h3 class="font-bold tabular-nums">
            {{ group.timeLabel
            }}<span
              v-if="group.dateLabel"
              class="ml-3 text-xs font-normal text-slate-500 dark:text-slate-400"
              >{{ group.dateLabel }}</span
            >
          </h3>
          <span class="text-xs text-slate-500 dark:text-slate-400"
            >{{ group.matches.length }} match{{
              group.matches.length > 1 ? 's' : ''
            }}</span
          >
        </header>
        <TournamentScheduleMatch
          v-for="match in group.matches"
          :key="`${match.seriesId}:${match.id}`"
          :match="match"
          :editable="editable"
          :series-id="seriesId"
          :openable-ids="openableIds"
          @open="open"
        />
      </section>
    </div>
    <div v-else class="space-y-5">
      <p class="text-xs text-slate-500 dark:text-slate-400">
        Créneaux de 30 minutes · Les matchs longs occupent plusieurs cases. Les
        horaires sont affichés en heure de Paris.
      </p>
      <section v-for="day in grid.days" :key="day.key" class="space-y-2">
        <h3 class="text-sm font-semibold capitalize">{{ day.label }}</h3>
        <div
          class="max-h-[70vh] overflow-auto rounded-lg border border-slate-200 dark:border-slate-700"
        >
          <table class="w-full border-separate border-spacing-0 text-sm">
            <caption class="sr-only">
              Occupation des tables ·
              {{
                day.label
              }}
            </caption>
            <thead>
              <tr>
                <th
                  class="sticky left-0 top-0 z-30 min-w-20 border-b border-r border-slate-200 bg-slate-800 p-3 text-left text-white dark:border-slate-700"
                >
                  Heure
                </th>
                <th
                  v-for="table in grid.tables"
                  :key="table ?? 'unassigned'"
                  class="sticky top-0 z-20 min-w-56 border-b border-r border-slate-200 bg-slate-100 p-3 text-left dark:border-slate-700 dark:bg-slate-800"
                >
                  {{ table === null ? 'Sans table' : `Table ${table}` }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in day.rows" :key="row.key">
                <th
                  class="sticky left-0 z-10 border-b border-r border-slate-200 bg-slate-800 p-3 text-left align-top text-white dark:border-slate-700"
                >
                  <span class="font-bold tabular-nums">{{
                    row.timeLabel
                  }}</span>
                </th>
                <td
                  v-for="cell in row.cells"
                  :key="cell.table ?? 'unassigned'"
                  class="border-b border-r border-slate-200 bg-slate-50 p-1.5 align-top dark:border-slate-700 dark:bg-slate-950"
                >
                  <p
                    v-if="cell.conflict"
                    class="mb-1 flex items-center gap-1 rounded bg-red-100 px-2 py-1 text-xs font-semibold text-red-700 dark:bg-red-950 dark:text-red-300"
                  >
                    <UIcon
                      name="i-heroicons-exclamation-triangle"
                    />Chevauchement
                  </p>
                  <div v-if="cell.entries.length" class="space-y-1.5">
                    <TournamentScheduleMatch
                      v-for="entry in cell.entries"
                      :key="`${entry.match.seriesId}:${entry.match.id}`"
                      :match="entry.match"
                      :editable="editable"
                      :series-id="seriesId"
                      :openable-ids="openableIds"
                      compact
                      :continuation="entry.continuation"
                      @open="open"
                    />
                  </div>
                  <p
                    v-for="pool in cell.pools"
                    :key="`${pool.seriesId}:${pool.poolId}`"
                    class="mt-1 rounded-md bg-blue-50 p-2 text-xs font-medium text-blue-900 dark:bg-blue-950 dark:text-blue-100"
                  >
                    {{
                      pool.status === 'in_progress'
                        ? 'Poule en cours'
                        : 'Table réservée'
                    }}
                    · {{ pool.seriesName }} · Poule {{ pool.poolId }}
                  </p>
                  <p
                    v-if="cell.hiddenCount"
                    class="p-2 text-xs font-medium text-slate-600 dark:text-slate-300"
                  >
                    Occupée · {{ cell.hiddenCount }} match{{
                      cell.hiddenCount > 1 ? 's' : ''
                    }}
                    hors filtre
                  </p>
                  <span
                    v-else-if="!cell.entries.length && !cell.pools.length"
                    class="block p-3 text-center text-slate-300 dark:text-slate-700"
                    aria-label="Table libre"
                    >—</span
                  >
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      <section v-if="grid.unplanned.length" class="space-y-2">
        <h3
          class="rounded-md border-l-4 border-slate-400 bg-slate-100 px-3 py-2 font-semibold dark:bg-slate-800"
        >
          Sans horaire · {{ grid.unplanned.length }} match{{
            grid.unplanned.length > 1 ? 's' : ''
          }}
        </h3>
        <div class="grid gap-2 md:grid-cols-2">
          <TournamentScheduleMatch
            v-for="match in grid.unplanned"
            :key="`${match.seriesId}:${match.id}`"
            :match="match"
            :editable="editable"
            :series-id="seriesId"
            :openable-ids="openableIds"
            @open="open"
          />
        </div>
      </section>
    </div>
  </div>
</template>
