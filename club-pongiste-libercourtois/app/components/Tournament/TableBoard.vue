<script setup lang="ts">
  import { tableOverview } from '~/utils/tournament-tables'
  import type {
    ScheduledMatch,
    ScheduledPool
  } from '~/utils/tournament-schedule'
  import type { TournamentTable } from '~/utils/tournament-tables'

  const props = defineProps<{
    matches: ScheduledMatch[]
    pools: ScheduledPool[]
    tableCount: number
    editable: boolean
    seriesId: number
    openableIds: number[]
    busy: boolean
  }>()
  const emit = defineEmits<{
    open: [id: number]
    reserve: [poolId: number, tables: number[]]
    refresh: []
  }>()
  const selectedPoolId = defineModel<number | null>('selectedPool', {
    default: null
  })
  const filter = ref('all')
  const firstTable = ref(''),
    secondTable = ref('')
  const tables = computed(function () {
    return tableOverview(props.matches, props.pools, props.tableCount)
  })
  const displayed = computed(function () {
    return tables.value.filter(function (table) {
      return filter.value === 'all' || table.status === filter.value
    })
  })
  const counts = computed(function () {
    const totals = {
      all: tables.value.length,
      free: 0,
      reserved: 0,
      playing: 0
    }
    for (const table of tables.value) totals[table.status]++
    return totals
  })
  const editablePools = computed(function () {
    return props.pools.filter(function (pool) {
      return (
        pool.seriesId === props.seriesId &&
        (pool.status === 'reserved' || !pool.tables.length)
      )
    })
  })
  const selectedPool = computed(function () {
    return editablePools.value.find(function (pool) {
      return pool.poolId === selectedPoolId.value
    })
  })
  const savedTables = computed(function () {
    return selectedPool.value?.tables.join(',') ?? ''
  })
  watch(
    editablePools,
    function (pools) {
      if (
        !pools.some(function (pool) {
          return pool.poolId === selectedPoolId.value
        })
      )
        selectedPoolId.value = pools[0]?.poolId ?? null
    },
    { immediate: true }
  )
  watch(
    [selectedPoolId, savedTables],
    function () {
      firstTable.value = String(selectedPool.value?.tables[0] ?? '')
      secondTable.value = String(selectedPool.value?.tables[1] ?? '')
    },
    { immediate: true }
  )
  const unassignedPools = computed(function () {
    return props.pools.filter(function (pool) {
      return pool.status === 'in_progress' && !pool.tables.length
    })
  })
  const statusLabels = {
    free: 'Libre',
    reserved: 'Réservée',
    playing: 'En match'
  }
  const statusClasses = {
    free: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100',
    reserved:
      'border-blue-200 bg-blue-50 text-blue-950 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100',
    playing:
      'border-violet-200 bg-violet-50 text-violet-950 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-100'
  }
  function available(table: TournamentTable): boolean {
    return (
      table.status === 'free' ||
      (!table.matches.length &&
        table.pools.every(function (pool) {
          return (
            pool.seriesId === props.seriesId &&
            pool.poolId === selectedPoolId.value
          )
        }))
    )
  }
  function reserve(): void {
    if (!selectedPool.value) return
    const selected = [firstTable.value, secondTable.value]
      .filter(Boolean)
      .map(Number)
    emit('reserve', selectedPool.value.poolId, selected)
  }
  function open(id: number): void {
    emit('open', id)
  }
</script>

<template>
  <div class="space-y-5">
    <header class="flex flex-wrap items-start justify-between gap-3">
      <h2 class="text-lg font-bold">Tables du tournoi</h2>
      <UButton
        color="neutral"
        variant="outline"
        icon="i-heroicons-arrow-path"
        :loading="busy"
        @click="emit('refresh')"
        >Actualiser</UButton
      >
    </header>
    <div class="flex flex-wrap gap-2" aria-label="Filtrer les tables par état">
      <UButton
        v-for="item in [
          { id: 'all', label: 'Toutes' },
          { id: 'free', label: 'Libres' },
          { id: 'reserved', label: 'Réservées' },
          { id: 'playing', label: 'En match' }
        ]"
        :key="item.id"
        color="neutral"
        :variant="filter === item.id ? 'solid' : 'outline'"
        :aria-pressed="filter === item.id"
        @click="filter = item.id"
      >
        {{ item.label }} · {{ counts[item.id as keyof typeof counts] }}
      </UButton>
    </div>
    <p v-if="editable" class="text-xs text-slate-500 dark:text-slate-400">
      Une table se libère au résultat du match, ou quand toutes les rencontres
      de sa poule sont terminées. Les horaires du planning ne la libèrent pas.
      Actualisation toutes les 15 secondes.
    </p>
    <UAlert
      v-if="editable && unassignedPools.length"
      color="info"
      title="Poules sans tables réservées"
      :description="`${unassignedPools.length} poule(s) en cours n’ont pas encore de tables réservées. Réservez leurs tables pour afficher leur occupation dans cette vue.`"
    />
    <form
      v-if="editable && editablePools.length"
      class="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900"
      @submit.prevent="reserve"
    >
      <h3 class="font-semibold">
        Réserver les tables d’une poule de cette série
      </h3>
      <p class="text-sm text-slate-600 dark:text-slate-300">
        Choisissez une ou deux tables, selon les numéros des plaquettes. Après
        le lancement, elles restent occupées jusqu’au dernier résultat de la
        poule.
      </p>
      <div class="flex flex-wrap items-end gap-3">
        <label class="space-y-1 text-sm"
          ><span class="block">Poule</span>
          <select
            v-model="selectedPoolId"
            class="rounded-md border border-slate-300 bg-white p-2 dark:border-slate-600 dark:bg-slate-950"
            :disabled="busy"
          >
            <option
              v-for="pool in editablePools"
              :key="pool.poolId"
              :value="pool.poolId"
            >
              Poule {{ pool.poolId }}
            </option>
          </select>
        </label>
        <label class="space-y-1 text-sm"
          ><span class="block">Première table</span>
          <select
            v-model="firstTable"
            class="rounded-md border border-slate-300 bg-white p-2 dark:border-slate-600 dark:bg-slate-950"
            :disabled="busy"
          >
            <option value="">Choisir</option>
            <option
              v-for="table in tables"
              :key="table.number"
              :value="String(table.number)"
              :disabled="!available(table)"
            >
              Table {{ table.number
              }}{{ available(table) ? '' : ' · indisponible' }}
            </option>
          </select>
        </label>
        <label class="space-y-1 text-sm"
          ><span class="block">Deuxième table</span>
          <select
            v-model="secondTable"
            class="rounded-md border border-slate-300 bg-white p-2 dark:border-slate-600 dark:bg-slate-950"
            :disabled="busy"
          >
            <option value="">Aucune</option>
            <option
              v-for="table in tables"
              :key="table.number"
              :value="String(table.number)"
              :disabled="
                !available(table) || String(table.number) === firstTable
              "
            >
              Table {{ table.number
              }}{{ available(table) ? '' : ' · indisponible' }}
            </option>
          </select>
        </label>
        <UButton
          type="submit"
          :loading="busy"
          :disabled="!firstTable || firstTable === secondTable"
          icon="i-heroicons-table-cells"
          >Réserver</UButton
        >
        <UButton
          v-if="
            selectedPool?.tables.length && selectedPool.status === 'reserved'
          "
          color="neutral"
          variant="outline"
          :disabled="busy"
          @click="emit('reserve', selectedPool.poolId, [])"
          >Annuler la réservation</UButton
        >
      </div>
    </form>
    <div
      v-if="displayed.length"
      class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
      aria-label="État actuel des tables"
    >
      <article
        v-for="table in displayed"
        :key="table.number"
        class="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
        :aria-label="`Table ${table.number} · ${statusLabels[table.status]}`"
      >
        <header
          class="flex items-center justify-between gap-3 border-b p-4"
          :class="statusClasses[table.status]"
        >
          <h3 class="text-lg font-bold">Table {{ table.number }}</h3>
          <span
            class="rounded-full bg-white/70 px-2.5 py-1 text-xs font-semibold dark:bg-black/20"
            >{{ statusLabels[table.status] }}</span
          >
        </header>
        <div class="space-y-3 p-4">
          <UAlert
            v-if="table.conflict"
            color="error"
            title="Plusieurs occupations sur cette table"
          />
          <div
            v-for="pool in table.pools"
            :key="`${pool.seriesId}:${pool.poolId}`"
            class="space-y-2"
          >
            <p class="text-sm font-semibold">
              {{ pool.seriesName }} · Poule {{ pool.poolId }}
            </p>
            <p class="text-sm text-slate-600 dark:text-slate-300">
              {{ pool.playerNames.join(' · ') }}
            </p>
            <p class="text-xs font-medium">
              {{ pool.completed }} / {{ pool.total }} rencontres terminées
            </p>
            <p
              v-if="editable && pool.status === 'in_progress'"
              class="text-xs text-slate-500 dark:text-slate-400"
            >
              Table conservée jusqu’à la fin de toute la poule.
            </p>
          </div>
          <TournamentScheduleMatch
            v-for="match in table.matches"
            :key="`${match.seriesId}:${match.id}`"
            :match="match"
            :editable="editable"
            :series-id="seriesId"
            :openable-ids="openableIds"
            compact
            @open="open"
          />
          <p
            v-if="editable && table.status === 'free'"
            class="text-sm text-slate-600 dark:text-slate-300"
          >
            Disponible pour lancer un match ou réserver une poule.
          </p>
          <div
            v-if="table.next"
            class="space-y-2 border-t border-slate-200 pt-3 dark:border-slate-700"
          >
            <p
              class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
            >
              Prochain match prévu
            </p>
            <TournamentScheduleMatch
              :match="table.next"
              :editable="editable && table.status === 'free'"
              :series-id="seriesId"
              :openable-ids="openableIds"
              compact
              @open="open"
            />
          </div>
        </div>
      </article>
    </div>
    <p
      v-else
      class="rounded-lg bg-slate-50 p-6 text-center text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400"
    >
      Aucune table ne correspond à cet état.
    </p>
  </div>
</template>
