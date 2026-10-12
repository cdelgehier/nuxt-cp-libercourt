<script setup lang="ts">
  import { scoreInput } from '~/utils/tournament-score'
  import { filterSchedule, matchTimeLabel } from '~/utils/tournament-schedule'
  import { matchTableNumbers } from '~~/server/domains/tournament/pool-tables'
  import {
    matchSheetTitle,
    paginateMatchSheets,
    selectMatchSheets
  } from '~/utils/tournament-match-sheets'
  import type { getTournamentSchedule } from '~~/server/domains/tournament/integral-service'
  import {
    handicapStart,
    poolStandings
  } from '~~/server/domains/tournament/integral'
  import type {
    IntegralState,
    IntegralMatch
  } from '~~/server/domains/tournament/integral'
  import type { TournamentSeries } from '~~/server/domains/tournament/types'

  interface RosterEntry {
    id: number
    firstName: string
    lastName: string
    club: string | null
    ranking: number | null
    partnerFirstName: string | null
    partnerLastName: string | null
    partnerClub: string | null
  }
  interface Snapshot {
    series: TournamentSeries
    registrations: RosterEntry[]
    version: number
    state: IntegralState | null
    tableCount: number
    isDemo: boolean
  }
  const props = withDefaults(
    defineProps<{
      slug: string
      seriesId: number
      apiBase?: string
      publicView?: boolean
      tournamentName?: string
    }>(),
    { apiBase: '/api/ja/tournois', publicView: false, tournamentName: '' }
  )
  const emit = defineEmits<{
    refresh: []
    'pools-cancelled': [seriesId: number]
  }>()
  const toast = useToast()
  const endpoint = computed(function () {
    return `${props.apiBase}/${props.slug}/series/${props.seriesId}/integral`
  })
  const { data: snapshot, error, refresh } = await useFetch<Snapshot>(endpoint)
  const printedSeriesName = computed(function () {
    const name = snapshot.value?.series.name ?? ''
    return snapshot.value?.isDemo ? `DEV · Démonstration · ${name}` : name
  })
  const scheduleEndpoint = computed(function () {
    return `${props.apiBase}/${props.slug}/schedule`
  })
  const {
    data: schedule,
    error: scheduleError,
    refresh: refreshSchedule
  } = await useFetch<Awaited<ReturnType<typeof getTournamentSchedule>>>(
    scheduleEndpoint
  )
  const scheduleSeries = ref(String(props.seriesId))
  const tablePool = ref<number | null>(null)
  watch(
    function () {
      return props.seriesId
    },
    function (id) {
      scheduleSeries.value = String(id)
    }
  )
  const scheduleTitle = computed(function () {
    if (!scheduleSeries.value) return 'Planning de toutes les séries'
    const match = schedule.value?.matches.find(function (entry) {
      return entry.seriesId === Number(scheduleSeries.value)
    })
    return `Planning · ${match?.seriesName ?? snapshot.value?.series.name ?? 'Série courante'}`
  })
  const printableSchedule = computed(function () {
    return filterSchedule(schedule.value?.matches ?? [], {
      seriesId: Number(scheduleSeries.value)
    })
  })
  const state = computed(function () {
    return snapshot.value?.state ?? null
  })
  const tab = ref('pools')
  watch(
    function () {
      return state.value?.phase
    },
    function (phase) {
      tab.value =
        phase === 'playoffs' || phase === 'placement'
          ? 'trees'
          : phase === 'finished'
            ? 'ranking'
            : 'pools'
    },
    { immediate: true }
  )
  const busy = ref(false)
  const selectedPlayer = ref<number | null>(null)
  const selectedPool = computed(function () {
    return state.value?.pools.find(function (pool) {
      return (
        selectedPlayer.value !== null &&
        pool.players.includes(selectedPlayer.value)
      )
    })
  })
  watch(
    [
      tab,
      function () {
        return state.value?.phase
      }
    ],
    cancelSwap
  )
  watch(selectedPool, function (pool) {
    if (!pool) cancelSwap()
  })
  const activeMatch = ref<IntegralMatch | null>(null)
  const modalOpen = ref(false)
  const poolModalOpen = ref(false)
  const launchModalOpen = ref(false)
  const launchConfirmation = ref<{
    action: 'start' | 'start-pool'
    confirmation: 'confirmShortRest' | 'confirmPlayerConflict'
    body: Record<string, unknown>
    version: number
    message: string
  } | null>(null)
  const activePool = ref<number | null>(null)
  const poolAdvances = ref<
    {
      matchId: number
      player1: number | null
      player2: number | null
      score1: number | ''
      score2: number | ''
    }[]
  >([])
  const table = ref(1)
  const startScores = reactive<[number, number]>([0, 0])
  const manualAdvance = ref(false)
  const setRows = ref<
    { score1: number | null | ''; score2: number | null | '' }[]
  >([])
  const poolOrders = reactive<Record<string, number[]>>({})
  const planStart = ref(
    new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16)
  )
  const duration = ref(snapshot.value?.state?.planning?.duration ?? 30),
    rest = ref(snapshot.value?.state?.planning?.rest ?? 10)
  const identityPlayer = ref(''),
    identityPartner = ref(false),
    identityValue = ref('')
  const printMode = ref('all')
  const printMatchIds = ref<number[] | null>(null)
  const matchSheetPages = computed(function () {
    return paginateMatchSheets(
      selectMatchSheets(state.value?.matches ?? [], printMatchIds.value)
    )
  })
  const search = ref('')
  const upcomingMatches = ref(true)
  function matchesSearch(id: number | null): boolean {
    return (
      !search.value.trim() ||
      `${playerName(id)} ${playerClub(id ?? 0)}`
        .toLowerCase()
        .includes(search.value.trim().toLowerCase())
    )
  }
  const displayedMatches = computed(function () {
    return readyMatches.value.filter(function (match) {
      return (
        (!upcomingMatches.value ||
          match.status === 'pending' ||
          match.status === 'in_progress') &&
        (matchesSearch(match.player1) || matchesSearch(match.player2))
      )
    })
  })
  const displayedPools = computed(function () {
    return (
      state.value?.pools.filter(function (pool) {
        return pool.players.some(matchesSearch)
      }) ?? []
    )
  })
  const displayedRanking = computed(function () {
    return ranking.value.filter(function (entry) {
      return matchesSearch(Number(entry[0]))
    })
  })
  const phaseLabels: Record<string, string> = {
    ready: 'Poules prêtes',
    pools: 'Poules',
    playoffs: 'Barrages',
    placement: 'Classement intégral',
    finished: 'Terminée'
  }
  const phaseProgress = computed(function () {
    const matches =
      state.value?.matches.filter(function (match) {
        return match.phase === state.value?.phase
      }) ?? []
    return {
      total: matches.length,
      finished: matches.filter(function (match) {
        return match.winner !== null
      }).length
    }
  })
  const readyMatches = computed(function () {
    return (
      state.value?.matches.filter(function (match) {
        return match.player1 !== null && match.player2 !== null
      }) ?? []
    )
  })
  const ranking = computed(function () {
    return Object.entries(state.value?.placements ?? {}).sort(function (a, b) {
      return a[1] - b[1]
    })
  })
  function playerName(id: number | null): string {
    const player = snapshot.value?.registrations.find(function (entry) {
      return entry.id === id
    })
    if (!player) return 'À déterminer'
    return player.partnerLastName
      ? `${player.firstName} ${player.lastName} / ${player.partnerFirstName ?? ''} ${player.partnerLastName}`
      : `${player.firstName} ${player.lastName}`
  }
  function playerClub(id: number): string {
    return (
      snapshot.value?.registrations.find(function (entry) {
        return entry.id === id
      })?.club ?? ''
    )
  }
  function playerRanking(id: number): number | null {
    const entrant = state.value?.entrants.find(function (entry) {
      return entry.id === id
    })
    return entrant?.ranking ?? null
  }
  function sheetPlayer(id: number | null) {
    const player = snapshot.value?.registrations.find(function (entry) {
      return entry.id === id
    })
    const clubs = [player?.club, player?.partnerClub].filter(Boolean)
    return {
      name: playerName(id),
      club: [...new Set(clubs)].join(' / '),
      ranking: id === null ? null : playerRanking(id)
    }
  }
  function isWithdrawn(id: number): boolean {
    return (
      state.value?.entrants.find(function (entry) {
        return entry.id === id
      })?.withdrawn ?? false
    )
  }
  function hasTie(id: number): boolean {
    if (
      state.value?.matches.some(function (match) {
        return match.poolId === id && match.winner === null
      })
    )
      return false
    return rowsForPool(id).some(function (row) {
      return row.tied
    })
  }
  const playoffMatches = computed(function () {
    return (
      state.value?.matches.filter(function (entry) {
        return entry.phase === 'playoffs'
      }) ?? []
    )
  })
  function matchLabel(
    match: Pick<IntegralMatch, 'phase' | 'poolId' | 'rangeStart' | 'rangeEnd'>
  ): string {
    if (match.phase === 'pools') return `Poule ${match.poolId}`
    return match.phase === 'playoffs'
      ? 'Barrage'
      : `Places ${match.rangeStart}–${match.rangeEnd}`
  }
  function matchTables(match: IntegralMatch): string {
    if (!state.value) return '—'
    return matchTableNumbers(state.value, match).join(' et ') || '—'
  }
  function matchScore(match: IntegralMatch): string {
    return match.status === 'forfeit'
      ? 'Forfait'
      : match.sets
          .map(function (set) {
            return `${set.score1}–${set.score2}`
          })
          .join(' / ')
  }
  function rowsForPool(id: number) {
    if (!state.value) return []
    const rows = poolStandings(
      state.value,
      state.value.pools.find(function (pool) {
        return pool.id === id
      })!
    )
    const order = state.value.poolOrders[String(id)]
    return order
      ? rows.sort(function (a, b) {
          return order.indexOf(a.id) - order.indexOf(b.id)
        })
      : rows
  }
  function matchForPool(id: number) {
    return (
      state.value?.matches.filter(function (match) {
        return match.poolId === id
      }) ?? []
    )
  }
  function canLaunchPool(id: number): boolean {
    return matchForPool(id).some(function (match) {
      return match.status === 'pending'
    })
  }
  function canSimulate(match: IntegralMatch): boolean {
    return (
      !props.publicView &&
      snapshot.value?.isDemo === true &&
      ['pending', 'in_progress'].includes(match.status) &&
      match.player1 !== null &&
      match.player2 !== null
    )
  }
  function canSimulatePool(id: number): boolean {
    return (
      ['ready', 'pools'].includes(state.value?.phase ?? '') &&
      matchForPool(id).some(canSimulate)
    )
  }
  async function simulateDemo(
    target: { poolId: number } | { matchId: number }
  ): Promise<void> {
    if (busy.value) return
    try {
      await command('poolId' in target ? 'demo-pool' : 'demo-match', target)
      modalOpen.value = false
      toast.add({
        title:
          'poolId' in target
            ? `Résultats de la poule ${target.poolId} simulés`
            : 'Résultat du match simulé',
        color: 'success'
      })
    } catch {
      // The command shows the server error and refreshes the snapshot.
    }
  }
  async function openPool(id: number): Promise<void> {
    activePool.value = id
    if (!state.value?.rules.handicap) {
      await launchPool()
      return
    }
    poolAdvances.value = matchForPool(id)
      .filter(function (match) {
        return match.status === 'pending'
      })
      .map(function (match) {
        try {
          const scores = handicapStart(
            playerRanking(match.player1!),
            playerRanking(match.player2!),
            state.value!.rules.pointsPerSet
          )
          return {
            matchId: match.id,
            player1: match.player1,
            player2: match.player2,
            score1: scores[0],
            score2: scores[1]
          }
        } catch {
          return {
            matchId: match.id,
            player1: match.player1,
            player2: match.player2,
            score1: '' as const,
            score2: '' as const
          }
        }
      })
    poolModalOpen.value = true
  }
  async function launchPool(): Promise<void> {
    if (activePool.value === null) return
    const advances: Record<string, [number, number]> = {}
    if (state.value?.rules.handicap) {
      for (const row of poolAdvances.value) {
        if (row.score1 === '' || row.score2 === '') {
          toast.add({
            title: 'Renseignez chaque avance, même si elle est nulle.',
            color: 'error'
          })
          return
        }
        advances[String(row.matchId)] = [row.score1, row.score2]
      }
    }
    try {
      await command('start-pool', {
        poolId: activePool.value,
        ...(state.value?.rules.handicap ? { advances } : {})
      })
      completeLaunch('start-pool')
    } catch {
      /* shown by command */
    }
  }
  async function command(
    action: string,
    body: Record<string, unknown> = {}
  ): Promise<void> {
    busy.value = true
    const version =
      typeof body.version === 'number'
        ? body.version
        : (snapshot.value?.version ?? 0)
    try {
      snapshot.value = await $fetch<Snapshot>(endpoint.value, {
        method: 'POST',
        body: { action, version, ...body }
      })
      await refreshSchedule()
      emit('refresh')
    } catch (error: unknown) {
      const failure = (
        error as {
          data?: { message?: string; data?: { code?: string } }
        }
      )?.data
      if (
        (failure?.data?.code === 'REST_CONFIRMATION_REQUIRED' ||
          failure?.data?.code === 'PLAYER_CONFLICT_CONFIRMATION_REQUIRED') &&
        (action === 'start' || action === 'start-pool')
      ) {
        launchConfirmation.value = {
          action,
          confirmation:
            failure.data.code === 'PLAYER_CONFLICT_CONFIRMATION_REQUIRED'
              ? 'confirmPlayerConflict'
              : 'confirmShortRest',
          body: structuredClone(body),
          version,
          message: failure.message ?? 'Ce lancement nécessite une confirmation.'
        }
        launchModalOpen.value = true
        throw error
      }
      toast.add({
        title: failure?.message ?? 'Action impossible',
        color: 'error'
      })
      await refresh()
      throw error
    } finally {
      busy.value = false
    }
  }
  function completeLaunch(action: 'start' | 'start-pool'): void {
    if (action === 'start-pool') {
      poolModalOpen.value = false
      toast.add({
        title: 'Poule lancée : les feuilles sont prêtes à être saisies.',
        color: 'success'
      })
    } else {
      modalOpen.value = false
      toast.add({ title: 'Match lancé.', color: 'success' })
    }
  }
  async function confirmLaunch(): Promise<void> {
    const pending = launchConfirmation.value
    if (!pending) return
    try {
      await command(pending.action, {
        ...structuredClone(toRaw(pending.body)),
        version: pending.version,
        [pending.confirmation]: true
      })
      completeLaunch(pending.action)
      launchModalOpen.value = false
      launchConfirmation.value = null
    } catch {
      // A second warning replaces the current one without closing the dialog.
      if (launchConfirmation.value === pending) {
        launchModalOpen.value = false
        launchConfirmation.value = null
      }
    }
  }
  async function generate(): Promise<void> {
    cancelSwap()
    try {
      await command('generate')
    } catch {
      /* shown by command */
    }
  }
  async function drop(): Promise<void> {
    cancelSwap()
    try {
      await command('drop')
      emit('pools-cancelled', props.seriesId)
    } catch {
      /* shown by command */
    }
  }
  async function swap(id: number): Promise<void> {
    if (state.value?.phase !== 'ready' || props.publicView || busy.value) return
    if (selectedPlayer.value === null) {
      selectedPlayer.value = id
      return
    }
    const first = selectedPlayer.value
    if (first === id) {
      cancelSwap()
      return
    }
    try {
      await command('swap', { first, second: id })
      cancelSwap()
      toast.add({
        title: 'Joueurs échangés',
        description: `${playerName(first)} ↔ ${playerName(id)}. Les poules sont mises à jour.`,
        color: 'success'
      })
    } catch {
      /* shown by command */
    }
  }
  function cancelSwap(): void {
    selectedPlayer.value = null
  }
  async function advance(): Promise<void> {
    try {
      await command('advance', { poolOrders: { ...poolOrders } })
    } catch {
      /* shown by command */
    }
  }
  function arbitrationOrder(poolId: number): number[] {
    return (
      poolOrders[String(poolId)] ??
      rowsForPool(poolId).map(function (row) {
        return row.id
      })
    )
  }
  function canMoveInTie(
    poolId: number,
    index: number,
    direction: number
  ): boolean {
    const order = arbitrationOrder(poolId),
      rows = rowsForPool(poolId)
    return [order[index], order[index + direction]].every(function (id) {
      return (
        id !== undefined &&
        rows.some(function (row) {
          return row.id === id && row.tied
        })
      )
    })
  }
  function moveInTie(poolId: number, index: number, direction: number): void {
    if (!canMoveInTie(poolId, index, direction)) return
    const order = [...arbitrationOrder(poolId)]
    const other = index + direction
    ;[order[index], order[other]] = [order[other]!, order[index]!]
    poolOrders[String(poolId)] = order
  }
  function canOpenMatch(
    match: Pick<IntegralMatch, 'phase' | 'status'>
  ): boolean {
    return (
      !props.publicView &&
      Boolean(state.value && state.value.phase !== 'ready') &&
      match.status !== 'forfeit' &&
      (match.phase !== 'pools' || match.status !== 'pending')
    )
  }
  function openMatch(match: IntegralMatch): void {
    if (!canOpenMatch(match)) return
    activeMatch.value = match
    table.value = match.table ?? 1
    manualAdvance.value = false
    startScores[0] = match.rules?.startScores[0] ?? 0
    startScores[1] = match.rules?.startScores[1] ?? 0
    if (!match.rules && state.value?.rules.handicap) {
      const first = state.value.entrants.find(function (entry) {
        return entry.id === match.player1
      })
      const second = state.value.entrants.find(function (entry) {
        return entry.id === match.player2
      })
      try {
        const scores = handicapStart(
          first?.ranking ?? null,
          second?.ranking ?? null,
          state.value.rules.pointsPerSet
        )
        startScores[0] = scores[0]
        startScores[1] = scores[1]
      } catch {
        manualAdvance.value = true
      }
    }
    setRows.value = Array.from(
      {
        length:
          (match.rules?.setsToWin ?? state.value?.rules.setsToWin ?? 1) * 2 - 1
      },
      function (_, index) {
        return {
          score1: match.sets[index]?.score1 ?? null,
          score2: match.sets[index]?.score2 ?? null
        }
      }
    )
    modalOpen.value = true
  }
  const openableScheduleIds = computed(function () {
    return readyMatches.value.filter(canOpenMatch).map(function (match) {
      return match.id
    })
  })
  function openScheduledMatch(id: number): void {
    const match = state.value?.matches.find(function (entry) {
      return entry.id === id
    })
    if (match) openMatch(match)
  }
  function openPoolTables(poolId: number): void {
    tablePool.value = poolId
    tab.value = 'tables'
  }
  async function reserveTables(
    poolId: number,
    tables: number[]
  ): Promise<void> {
    try {
      await command('reserve-pool-tables', { poolId, tables })
      toast.add({
        title: tables.length
          ? 'Tables réservées à la poule'
          : 'Réservation annulée',
        color: 'success'
      })
    } catch {
      /* shown by command */
    }
  }
  async function refreshTables(): Promise<void> {
    await Promise.all([refresh(), refreshSchedule()])
  }
  async function launch(): Promise<void> {
    if (!activeMatch.value) return
    const id = activeMatch.value.id
    try {
      await command('start', {
        matchId: id,
        ...(activeMatch.value.phase !== 'pools' ? { table: table.value } : {}),
        ...(state.value?.rules.handicap && manualAdvance.value
          ? { startScores: [...startScores] }
          : {})
      })
      completeLaunch('start')
    } catch {
      /* shown by command */
    }
  }
  async function saveScore(): Promise<void> {
    if (!activeMatch.value) return
    let sets: { score1: number; score2: number }[]
    try {
      sets = scoreInput(setRows.value)
    } catch (error) {
      toast.add({
        title: error instanceof Error ? error.message : 'Scores incomplets',
        color: 'error'
      })
      return
    }
    try {
      await command('score', { matchId: activeMatch.value.id, sets })
      modalOpen.value = false
    } catch {
      /* shown by command */
    }
  }
  async function withdraw(winnerId: number): Promise<void> {
    if (!activeMatch.value) return
    try {
      await command('forfeit', { matchId: activeMatch.value.id, winnerId })
      modalOpen.value = false
    } catch {
      /* shown by command */
    }
  }
  async function plan(): Promise<void> {
    busy.value = true
    try {
      await $fetch(`${props.apiBase}/${props.slug}/schedule`, {
        method: 'POST',
        body: {
          versions: schedule.value?.versions ?? {},
          startAt: new Date(planStart.value).toISOString(),
          duration: duration.value,
          rest: rest.value
        }
      })
      await refresh()
      await refreshSchedule()
      emit('refresh')
      toast.add({
        title: 'Planning recalculé pour toutes les séries',
        color: 'success'
      })
    } catch (error: unknown) {
      await refreshSchedule()
      toast.add({
        title:
          (error as { data?: { message?: string } })?.data?.message ??
          'Planning impossible',
        color: 'error'
      })
    } finally {
      busy.value = false
    }
  }
  async function attachIdentity(): Promise<void> {
    try {
      await command('identity', {
        registrationId: Number(identityPlayer.value),
        partner: identityPartner.value,
        identity: identityValue.value
      })
    } catch {
      /* shown by command */
    }
  }
  async function print(): Promise<void> {
    printMatchIds.value = null
    await nextTick()
    window.print()
  }
  async function printMatches(matches: IntegralMatch[]): Promise<void> {
    printMode.value = 'matches'
    printMatchIds.value = matches.map(function (match) {
      return match.id
    })
    await nextTick()
    window.print()
  }
  const { pause } = useIntervalFn(function () {
    if (!modalOpen.value && !busy.value) {
      refresh()
      refreshSchedule()
    }
  }, 15000)
  onUnmounted(pause)
</script>

<template>
  <div class="integral-board space-y-5" @keydown.esc="!busy && cancelSwap()">
    <UAlert
      v-if="snapshot?.isDemo"
      color="info"
      variant="soft"
      icon="i-heroicons-beaker"
      title="DEV · Tournoi de démonstration"
      :description="
        publicView
          ? 'Les participants et résultats de ce tournoi peuvent être fictifs.'
          : 'Simulez un match ou toute une poule. Les résultats déjà enregistrés sont conservés ; les passages de phase restent à valider.'
      "
    />
    <UAlert
      v-if="error"
      color="error"
      title="Chargement impossible"
      :description="error.data?.message ?? 'Actualisez la page.'"
    />
    <div
      class="no-print flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900"
    >
      <div class="space-y-1">
        <h3 class="font-semibold text-slate-900 dark:text-white">
          {{
            !state
              ? 'Préparer les poules'
              : state.phase === 'ready'
                ? state.pools.length
                  ? 'Poules prêtes à jouer'
                  : 'Finale prête à jouer'
                : phaseLabels[state.phase]
          }}
        </h3>
        <p
          v-if="!publicView && state?.phase === 'ready' && state.pools.length"
          class="text-sm text-slate-600 dark:text-slate-400"
        >
          Vérifiez la répartition, puis lancez une poule avec son bouton. Le
          premier lancement démarre la série.
        </p>
        <p
          v-else-if="phaseProgress.total"
          class="text-sm text-slate-600 dark:text-slate-400"
        >
          {{ phaseProgress.finished }} / {{ phaseProgress.total }} rencontres
          terminées
        </p>
        <p v-if="snapshot" class="text-xs text-slate-500">
          {{ snapshot.series.setsToWin }} manche(s) gagnante(s) ·
          {{ snapshot.series.pointsPerSet }} points<span
            v-if="state?.rules.handicap"
          >
            · handicap à chaque manche</span
          >
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <UButton
          v-if="!publicView && !state"
          icon="i-heroicons-table-cells"
          :loading="busy"
          @click="generate"
          >Préparer les poules</UButton
        >
        <details
          v-if="!publicView && state?.phase === 'ready'"
          class="relative"
        >
          <summary
            class="cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
          >
            {{
              state?.pools.length ? 'Ajuster les poules' : 'Ajuster la série'
            }}
          </summary>
          <div
            class="absolute right-0 z-20 mt-2 flex min-w-56 flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-lg"
          >
            <UButton
              color="neutral"
              variant="outline"
              :loading="busy"
              @click="generate"
              >{{
                state?.pools.length
                  ? 'Rétablir la répartition automatique'
                  : 'Régénérer la finale'
              }}</UButton
            >
            <UButton
              color="neutral"
              variant="outline"
              :loading="busy"
              @click="drop"
              >{{
                state?.pools.length ? 'Annuler les poules' : 'Annuler la finale'
              }}</UButton
            >
          </div>
        </details>
        <UButton
          v-if="
            !publicView &&
            state &&
            (['pools', 'playoffs'].includes(state.phase) ||
              (state.phase === 'ready' && !state.pools.length))
          "
          icon="i-heroicons-arrow-right"
          :disabled="
            state.phase !== 'ready' &&
            phaseProgress.finished < phaseProgress.total
          "
          :loading="busy"
          @click="advance"
          >{{
            state.phase === 'ready'
              ? 'Ouvrir la finale'
              : state.phase === 'pools'
                ? 'Valider les poules et ouvrir les barrages'
                : 'Valider les barrages et ouvrir les arbres'
          }}</UButton
        >
        <details v-if="!publicView">
          <summary
            class="cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
          >
            Impressions
          </summary>
          <div class="mt-2 flex flex-wrap items-center gap-2">
            <select
              v-model="printMode"
              aria-label="Feuilles à imprimer"
              class="rounded border p-2 text-sm"
              @change="printMatchIds = null"
            >
              <option value="all">Toutes les feuilles</option>
              <option value="pools">Poules</option>
              <option value="matches">Feuilles de matchs</option>
              <option value="trees">Barrages et arbres</option>
              <option value="ranking">Classement</option>
              <option value="schedule">Planning</option>
            </select>
            <UButton
              color="neutral"
              variant="outline"
              icon="i-heroicons-printer"
              @click="print"
              >Imprimer</UButton
            >
            <span
              v-if="state && (printMode === 'all' || printMode === 'matches')"
              class="text-xs text-gray-500"
            >
              Matchs : 4 par page A4 · choisir « 1 page par feuille » à
              l’impression
            </span>
          </div>
        </details>
      </div>
    </div>
    <nav class="no-print flex flex-wrap gap-2" aria-label="Phases du tournoi">
      <UButton
        v-for="item in [
          { id: 'pools', label: 'Poules' },
          { id: 'playoffs', label: 'Barrages' },
          { id: 'trees', label: 'Arbres' },
          { id: 'ranking', label: 'Classement' },
          { id: 'matches', label: 'Matchs' },
          { id: 'schedule', label: 'Planning' },
          { id: 'tables', label: 'Tables' }
        ]"
        :key="item.id"
        :disabled="!state && item.id !== 'tables'"
        :variant="tab === item.id ? 'solid' : 'outline'"
        color="neutral"
        @click="tab = item.id"
        >{{ item.label }}</UButton
      >
    </nav>
    <section v-if="tab === 'tables'" class="no-print">
      <UAlert
        v-if="scheduleError"
        color="error"
        title="L’occupation des tables n’a pas pu être chargée."
      />
      <TournamentTableBoard
        v-else
        v-model:selected-pool="tablePool"
        :matches="schedule?.matches ?? []"
        :pools="schedule?.pools ?? []"
        :table-count="snapshot?.tableCount ?? 0"
        :editable="!publicView"
        :series-id="seriesId"
        :openable-ids="openableScheduleIds"
        :busy="busy"
        @open="openScheduledMatch"
        @reserve="reserveTables"
        @refresh="refreshTables"
      />
    </section>
    <p v-if="!state && tab !== 'tables'" class="text-gray-500">
      Les poules seront affichées après leur génération.
    </p>
    <template v-if="state">
      <UInput
        v-if="tab !== 'tables'"
        v-model="search"
        aria-label="Rechercher un joueur ou un club"
        placeholder="Rechercher un joueur ou un club"
        class="no-print w-full max-w-sm"
      />
      <section v-if="tab === 'pools'" class="no-print space-y-4">
        <div
          v-if="state.pools.length && state.phase === 'ready' && !publicView"
          class="flex flex-wrap items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-950 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100"
          :class="{ 'sticky top-20 z-20 shadow-md': selectedPlayer !== null }"
        >
          <UIcon
            name="i-heroicons-arrows-right-left"
            class="mt-0.5 size-5 shrink-0"
          />
          <div
            class="min-w-0 flex-1 space-y-2"
            aria-live="polite"
            aria-atomic="true"
          >
            <template v-if="selectedPlayer !== null">
              <h3 class="font-semibold">
                {{
                  busy
                    ? 'Enregistrement de l’échange…'
                    : 'Échange en préparation'
                }}
              </h3>
              <p class="text-sm">
                <strong>{{ playerName(selectedPlayer) }}</strong>
                ·
                {{
                  playerRanking(selectedPlayer) === null
                    ? 'Points FFTT non renseignés'
                    : `${playerRanking(selectedPlayer)} pts FFTT`
                }}
                · Poule {{ selectedPool?.id }}
              </p>
              <p class="text-sm">
                Cliquez sur un autre joueur pour échanger leurs places.
                L’échange sera enregistré immédiatement.
              </p>
            </template>
            <template v-else>
              <h3 class="font-semibold">Réorganiser les poules</h3>
              <ol class="space-y-1 text-sm">
                <li>
                  1. Cliquez sur le nom du joueur que vous souhaitez déplacer.
                </li>
                <li>
                  2. Cliquez sur un autre joueur pour échanger leurs places,
                  dans la même poule ou une autre.
                </li>
              </ol>
              <p class="text-xs text-blue-800 dark:text-blue-200">
                Répétez les échanges pour obtenir la répartition souhaitée,
                avant de lancer la première poule.
              </p>
            </template>
          </div>
          <div v-if="selectedPlayer !== null" class="space-y-1">
            <UButton
              color="neutral"
              variant="outline"
              icon="i-heroicons-x-mark"
              :disabled="busy"
              @click="cancelSwap"
              >Annuler la sélection</UButton
            >
            <p class="text-xs text-blue-800 dark:text-blue-200">
              Ou Échap / recliquer sur ce joueur
            </p>
          </div>
        </div>
        <p
          v-if="
            state.pools.length &&
            ['ready', 'pools'].includes(state.phase) &&
            !publicView
          "
          class="text-sm text-gray-500"
        >
          Lancez une poule pour ouvrir la saisie de toutes ses rencontres. Les
          joueurs les disputent dans l’ordre choisi, sur une ou deux tables.
          <strong>Tables attribuées à la poule :</strong> les numéros des
          plaquettes portant ses feuilles de match indiquent les tables où
          jouer.
        </p>
        <div class="grid gap-4 lg:grid-cols-2">
          <article
            v-for="pool in displayedPools"
            :key="pool.id"
            class="overflow-x-auto rounded-xl border p-4"
          >
            <div class="mb-3 flex items-center justify-between gap-3">
              <h3 class="font-bold">Poule {{ pool.id }}</h3>
              <div class="flex items-center gap-2">
                <UButton
                  v-if="
                    !publicView &&
                    ['ready', 'pools'].includes(state.phase) &&
                    canLaunchPool(pool.id)
                  "
                  color="neutral"
                  variant="outline"
                  size="sm"
                  icon="i-heroicons-table-cells"
                  :aria-label="`Réserver les tables de la poule ${pool.id}`"
                  @click="openPoolTables(pool.id)"
                  >Tables</UButton
                >
                <UButton
                  v-if="canSimulatePool(pool.id)"
                  size="sm"
                  variant="soft"
                  icon="i-heroicons-beaker"
                  :disabled="busy"
                  :aria-label="`Simuler les résultats de la poule ${pool.id}`"
                  @click="simulateDemo({ poolId: pool.id })"
                  >Simuler la poule</UButton
                >
                <UButton
                  v-if="
                    !publicView &&
                    ['ready', 'pools'].includes(state.phase) &&
                    canLaunchPool(pool.id)
                  "
                  size="sm"
                  icon="i-heroicons-play"
                  :loading="busy"
                  :aria-label="`Lancer la poule ${pool.id}`"
                  @click="openPool(pool.id)"
                  >Lancer la poule</UButton
                >
                <UButton
                  v-if="!publicView"
                  color="neutral"
                  variant="ghost"
                  icon="i-heroicons-printer"
                  :aria-label="`Imprimer les feuilles de matchs de la poule ${pool.id}`"
                  :title="`Imprimer les feuilles de matchs de la poule ${pool.id}`"
                  @click="printMatches(matchForPool(pool.id))"
                />
              </div>
            </div>
            <p
              v-if="pool.tables?.length"
              class="mb-3 text-xs font-medium text-blue-800 dark:text-blue-200"
            >
              Plaquette{{ pool.tables.length > 1 ? 's' : '' }} / table{{
                pool.tables.length > 1 ? 's' : ''
              }}
              : {{ pool.tables.join(', ') }}
            </p>
            <table class="w-full text-sm">
              <thead>
                <tr>
                  <th>Rang</th>
                  <th class="text-left">Joueur / paire</th>
                  <th>Pts</th>
                  <th>V–D</th>
                  <th>Manches</th>
                  <th>Points</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, index) in rowsForPool(pool.id)"
                  :key="row.id"
                  class="border-t"
                  :class="{
                    'bg-blue-100 dark:bg-blue-950': selectedPlayer === row.id
                  }"
                >
                  <td class="py-2 text-center">
                    {{
                      state.poolOrders[String(pool.id)]?.indexOf(row.id)! >= 0
                        ? state.poolOrders[String(pool.id)]!.indexOf(row.id) + 1
                        : index + 1
                    }}
                  </td>
                  <td>
                    <button
                      class="rounded px-1 py-1 text-left disabled:cursor-default"
                      :class="{
                        'text-primary font-bold': selectedPlayer === row.id,
                        'cursor-pointer hover:bg-blue-100 hover:text-blue-800 focus-visible:outline-2 focus-visible:outline-blue-700 dark:hover:bg-blue-900 dark:hover:text-blue-100':
                          !publicView && state.phase === 'ready'
                      }"
                      :disabled="publicView || state.phase !== 'ready' || busy"
                      :aria-pressed="
                        !publicView && state.phase === 'ready'
                          ? selectedPlayer === row.id
                          : undefined
                      "
                      @click="swap(row.id)"
                    >
                      {{ playerName(row.id) }}</button
                    ><span
                      v-if="selectedPlayer === row.id"
                      class="ml-1 inline-block rounded bg-blue-700 px-1.5 py-0.5 text-xs font-medium text-white"
                      >Sélectionné</span
                    ><span
                      v-if="
                        row.tied && state.phase === 'pools' && hasTie(pool.id)
                      "
                      class="ml-2 text-amber-600"
                      >Égalité à valider</span
                    ><small class="block text-gray-500">
                      <span v-if="playerClub(row.id)">
                        {{ playerClub(row.id) }} ·
                      </span>
                      <span
                        class="font-medium text-slate-700 dark:text-slate-300"
                      >
                        {{
                          playerRanking(row.id) === null
                            ? 'Points FFTT non renseignés'
                            : `${playerRanking(row.id)} pts FFTT`
                        }}
                      </span>
                    </small>
                  </td>
                  <td class="text-center">{{ row.points }}</td>
                  <td class="text-center">{{ row.wins }}–{{ row.losses }}</td>
                  <td class="text-center">
                    {{ row.setsWon }}/{{ row.setsLost }}
                  </td>
                  <td class="text-center">
                    {{ row.pointsWon }}/{{ row.pointsLost }}
                  </td>
                </tr>
              </tbody>
            </table>
            <div
              v-if="!publicView && state.phase === 'pools' && hasTie(pool.id)"
              class="mt-3"
            >
              <p class="text-sm font-semibold">Départage JA</p>
              <p class="mb-2 text-sm text-gray-500">
                Ordonnez les joueurs encore à égalité, puis validez les poules.
              </p>
              <ol class="space-y-2">
                <li
                  v-for="(id, index) in arbitrationOrder(pool.id)"
                  :key="id"
                  class="flex items-center gap-2"
                >
                  <span class="flex-1"
                    >{{ index + 1 }}. {{ playerName(id) }}</span
                  >
                  <UButton
                    size="xs"
                    color="neutral"
                    variant="outline"
                    :disabled="!canMoveInTie(pool.id, index, -1)"
                    :aria-label="`Monter ${playerName(id)}`"
                    @click="moveInTie(pool.id, index, -1)"
                    >↑</UButton
                  >
                  <UButton
                    size="xs"
                    color="neutral"
                    variant="outline"
                    :disabled="!canMoveInTie(pool.id, index, 1)"
                    :aria-label="`Descendre ${playerName(id)}`"
                    @click="moveInTie(pool.id, index, 1)"
                    >↓</UButton
                  >
                </li>
              </ol>
              <UButton
                class="mt-2"
                size="sm"
                :variant="poolOrders[String(pool.id)] ? 'solid' : 'outline'"
                @click="
                  poolOrders[String(pool.id)] = [...arbitrationOrder(pool.id)]
                "
                >{{
                  poolOrders[String(pool.id)]
                    ? 'Ordre confirmé'
                    : 'Confirmer cet ordre'
                }}</UButton
              >
            </div>
            <div class="mt-3 space-y-2">
              <div
                v-for="match in matchForPool(pool.id)"
                :key="match.id"
                class="flex flex-wrap items-center justify-between gap-2 border-t pt-2 text-sm"
              >
                <span
                  >{{ playerName(match.player1) }} —
                  {{ playerName(match.player2) }}
                  <strong class="ml-2">{{ matchScore(match) }}</strong></span
                ><UButton
                  v-if="canOpenMatch(match)"
                  size="xs"
                  variant="outline"
                  @click="openMatch(match)"
                  >{{
                    match.status === 'finished' ? 'Corriger' : 'Saisir'
                  }}</UButton
                >
                <UButton
                  v-if="canSimulate(match)"
                  size="xs"
                  variant="soft"
                  icon="i-heroicons-beaker"
                  :disabled="busy"
                  :aria-label="`Simuler le match ${match.id}`"
                  @click="simulateDemo({ matchId: match.id })"
                  >Simuler</UButton
                >
              </div>
            </div>
          </article>
        </div>
        <p v-if="!state.pools.length">Deux participants : finale directe.</p>
      </section>
      <section v-if="tab === 'playoffs'" class="no-print space-y-3">
        <h2 class="text-lg font-bold">Barrages</h2>
        <p class="text-sm text-gray-500">
          Les premiers de poule sont qualifiés directement. Un deuxième sans
          troisième adverse est également qualifié.
        </p>
        <article
          v-for="match in playoffMatches"
          :key="match.id"
          class="rounded-lg border p-4"
        >
          <div class="mb-3 flex items-center justify-between gap-3">
            <h3 class="font-bold">Barrage</h3>
            <UButton
              v-if="!publicView"
              color="neutral"
              variant="ghost"
              icon="i-heroicons-printer"
              :disabled="match.player1 === null || match.player2 === null"
              :aria-label="`Imprimer la feuille du barrage : ${playerName(match.player1)} contre ${playerName(match.player2)}`"
              title="Imprimer la feuille du barrage"
              @click="printMatches([match])"
            />
          </div>
          <div class="flex flex-wrap items-center justify-between gap-3">
            <span
              >{{ playerName(match.player1) }} —
              {{ playerName(match.player2) }}
              <strong>{{ matchScore(match) }}</strong></span
            ><UButton
              v-if="!publicView && match.status !== 'forfeit'"
              @click="openMatch(match)"
              >{{
                match.status === 'finished'
                  ? 'Corriger'
                  : match.status === 'in_progress'
                    ? 'Saisir'
                    : 'Lancer'
              }}</UButton
            >
            <UButton
              v-if="canSimulate(match)"
              variant="soft"
              icon="i-heroicons-beaker"
              :disabled="busy"
              :aria-label="`Simuler le match ${match.id}`"
              @click="simulateDemo({ matchId: match.id })"
              >Simuler</UButton
            >
          </div>
        </article>
      </section>
      <section v-if="tab === 'trees'" class="no-print">
        <TournamentPlacementTree
          :state="state"
          :registrations="snapshot?.registrations ?? []"
          :editable="!publicView"
          @open="openMatch"
        />
      </section>
      <section v-if="tab === 'ranking'" class="no-print">
        <h2 class="mb-3 text-lg font-bold">
          Classement final · {{ ranking.length }}/{{ state.entrants.length }}
        </h2>
        <table class="w-full text-sm">
          <thead>
            <tr>
              <th class="w-16">Place</th>
              <th class="text-left">Joueur / paire</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="[id, place] in displayedRanking"
              :key="id"
              class="border-t"
            >
              <td class="p-3 text-center font-bold">{{ place }}</td>
              <td>
                {{ playerName(Number(id))
                }}<span
                  v-if="isWithdrawn(Number(id))"
                  class="ml-2 text-gray-500"
                  >Forfait</span
                >
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="!ranking.length" class="py-5 text-gray-500">
          Les places sont attribuées à la fin des branches de classement.
        </p>
      </section>
      <section
        v-if="tab === 'matches' || tab === 'schedule'"
        class="no-print space-y-4"
      >
        <div
          v-if="tab === 'schedule' && !publicView"
          class="flex flex-wrap items-end gap-3"
        >
          <label
            >Début<input
              v-model="planStart"
              type="datetime-local"
              class="block rounded border p-2" /></label
          ><label
            >Durée (min)<input
              v-model.number="duration"
              type="number"
              min="1"
              max="240"
              class="block w-24 rounded border p-2" /></label
          ><label
            >Repos (min)<input
              v-model.number="rest"
              type="number"
              min="0"
              max="120"
              class="block w-24 rounded border p-2" /></label
          ><UButton :loading="busy" @click="plan"
            >Replanifier toutes les séries</UButton
          >
        </div>
        <div v-if="tab === 'schedule'">
          <UAlert
            v-if="scheduleError"
            color="error"
            title="Le planning n’a pas pu être chargé."
          />
          <TournamentScheduleBoard
            v-else
            v-model:selected-series="scheduleSeries"
            :matches="schedule?.matches ?? []"
            :pools="schedule?.pools ?? []"
            :table-count="snapshot?.tableCount ?? 0"
            :search="search"
            :editable="!publicView"
            :series-id="seriesId"
            :series-name="snapshot?.series.name ?? 'Série courante'"
            :title="scheduleTitle"
            :openable-ids="openableScheduleIds"
            @open="openScheduledMatch"
          />
        </div>
        <div v-else class="overflow-x-auto">
          <label class="mb-4 flex items-center gap-2 text-sm">
            <input
              v-model="upcomingMatches"
              type="checkbox"
              class="h-4 w-4 accent-blue-600"
            />
            À venir seulement
          </label>
          <p
            v-if="!displayedMatches.length"
            class="rounded-lg bg-slate-50 p-8 text-center text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400"
          >
            Aucun match ne correspond aux filtres.
          </p>
          <table v-else class="w-full text-sm">
            <thead>
              <tr>
                <th class="p-3 text-left">Phase</th>
                <th class="p-3 text-left">Table / heure</th>
                <th class="text-left">Joueur / paire</th>
                <th>Départ</th>
                <th>Score</th>
                <th v-if="!publicView">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="match in displayedMatches"
                :key="match.id"
                class="border-t"
              >
                <td class="p-3">{{ matchLabel(match) }}</td>
                <td>
                  <div>{{ matchTables(match) }}</div>
                  <div class="text-xs text-slate-500 dark:text-slate-400">
                    {{ matchTimeLabel(match, true) || '—' }}
                  </div>
                </td>
                <td>
                  {{ playerName(match.player1) }}<br />{{
                    playerName(match.player2)
                  }}
                </td>
                <td class="text-center">
                  {{ match.rules?.startScores.join('–') ?? 'À figer' }}
                </td>
                <td>
                  {{ matchScore(match)
                  }}<span
                    v-if="match.status === 'in_progress'"
                    class="text-green-600"
                    >En cours</span
                  >
                </td>
                <td v-if="!publicView">
                  <UButton
                    v-if="canSimulate(match)"
                    class="mr-2"
                    size="sm"
                    variant="soft"
                    icon="i-heroicons-beaker"
                    :disabled="busy"
                    :aria-label="`Simuler le match ${match.id}`"
                    @click="simulateDemo({ matchId: match.id })"
                    >Simuler</UButton
                  >
                  <UButton
                    v-if="canOpenMatch(match)"
                    size="sm"
                    @click="openMatch(match)"
                    >{{
                      match.status === 'finished'
                        ? 'Corriger'
                        : match.status === 'in_progress'
                          ? 'Saisir'
                          : 'Lancer'
                    }}</UButton
                  ><span
                    v-else-if="
                      match.phase === 'pools' && match.status === 'pending'
                    "
                    class="text-gray-500"
                    >Lancer depuis Poules</span
                  >
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <details
          v-if="!publicView && tab === 'schedule'"
          class="rounded border p-3"
        >
          <summary class="cursor-pointer font-medium">
            Rattacher un joueur sans licence entre plusieurs séries
          </summary>
          <p class="my-2 text-sm text-gray-500">
            Copiez la même identité dans les séries où joue cette personne (y
            compris comme partenaire).
          </p>
          <div class="flex flex-wrap gap-2">
            <select
              v-model="identityPlayer"
              aria-label="Joueur"
              class="rounded border p-2"
            >
              <option value="">Choisir</option>
              <option
                v-for="entry in state.entrants"
                :key="entry.id"
                :value="String(entry.id)"
              >
                {{ playerName(entry.id) }}
              </option></select
            ><label class="flex items-center gap-2"
              ><input
                v-model="identityPartner"
                type="checkbox"
              />Partenaire</label
            ><UInput
              v-model="identityValue"
              placeholder="ex. joueur:cedric"
            /><UButton
              :disabled="!identityPlayer || !identityValue"
              @click="attachIdentity"
              >Rattacher</UButton
            >
          </div>
          <ul class="mt-3 text-xs">
            <li v-for="entry in state.entrants" :key="entry.id">
              {{ playerName(entry.id) }} : {{ entry.identities.join(' / ') }}
            </li>
          </ul>
        </details>
      </section>

      <div v-if="!publicView" class="tournament-print hidden">
        <h1 v-if="printMode !== 'matches' && printMode !== 'trees'">
          {{ printedSeriesName }} · Tournoi intégral
        </h1>
        <section v-if="printMode === 'all' || printMode === 'pools'">
          <article
            v-for="pool in state.pools"
            :key="pool.id"
            class="print-sheet"
          >
            <h2>Poule {{ pool.id }}</h2>
            <table>
              <thead>
                <tr>
                  <th>Joueur / paire</th>
                  <th>Points FFTT</th>
                  <th>Pts poule</th>
                  <th>Rang</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in rowsForPool(pool.id)" :key="row.id">
                  <td>{{ playerName(row.id) }}</td>
                  <td>{{ playerRanking(row.id) }}</td>
                  <td>{{ row.points }}</td>
                  <td>{{ index + 1 }}</td>
                </tr>
              </tbody>
            </table>
            <table>
              <thead>
                <tr>
                  <th>Match</th>
                  <th class="p-3 text-left">Table / heure</th>
                  <th>Manches</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="match in matchForPool(pool.id)" :key="match.id">
                  <td>
                    {{ playerName(match.player1) }} /
                    {{ playerName(match.player2) }}
                  </td>
                  <td>
                    {{ matchTables(match) }} ·
                    {{ matchTimeLabel(match, true) || '—' }}
                  </td>
                  <td>
                    {{
                      matchScore(match) ||
                      '____ / ____ / ____ / ____ / ____ / ____ / ____'
                    }}
                  </td>
                </tr>
              </tbody>
            </table>
          </article>
        </section>
        <section v-if="printMode === 'all' || printMode === 'matches'">
          <div
            v-for="(page, index) in matchSheetPages"
            :key="index"
            class="print-sheet match-sheet-page"
          >
            <TournamentMatchSheet
              v-for="match in page"
              :key="match.id"
              :title="matchSheetTitle(match, state.matches)"
              :tournament-name="tournamentName"
              :series-name="printedSeriesName"
              :match="match"
              :rules="state.rules"
              :players="[
                sheetPlayer(match.player1),
                sheetPlayer(match.player2)
              ]"
            />
          </div>
        </section>
        <TournamentPlacementPrint
          v-if="printMode === 'all' || printMode === 'trees'"
          :state="state"
          :registrations="snapshot?.registrations ?? []"
          :series-name="printedSeriesName"
          :tournament-name="tournamentName"
        />
        <section
          v-if="printMode === 'all' || printMode === 'ranking'"
          class="print-sheet"
        >
          <h2>Classement final</h2>
          <table>
            <tbody>
              <tr v-for="[id, place] in ranking" :key="id">
                <td>{{ place }}</td>
                <td>{{ playerName(Number(id)) }}</td>
              </tr>
            </tbody>
          </table>
        </section>
        <section
          v-if="printMode === 'all' || printMode === 'schedule'"
          class="print-sheet"
        >
          <h2>{{ scheduleTitle }}</h2>
          <table>
            <thead>
              <tr>
                <th>Heure</th>
                <th>Table</th>
                <th class="p-3 text-left">Phase</th>
                <th>Série</th>
                <th>Joueurs</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="match in printableSchedule"
                :key="`${match.seriesId}:${match.id}`"
              >
                <td>{{ matchTimeLabel(match, true) || '—' }}</td>
                <td>{{ match.tables.join(' et ') || '—' }}</td>
                <td>{{ matchLabel(match) }}</td>
                <td>{{ match.seriesName }}</td>
                <td>{{ match.player1Name }} — {{ match.player2Name }}</td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>
    </template>
    <UModal
      v-model:open="poolModalOpen"
      :title="`Lancer la poule ${activePool}`"
      description="Vérifiez les avances de chaque rencontre avant le lancement de la poule."
    >
      <template #body>
        <div class="space-y-4">
          <p class="text-sm text-gray-500">
            Contrôlez le départ de chaque manche avant de lancer les rencontres.
            Pour un classement manquant, saisissez une avance, même nulle.
          </p>
          <div
            v-for="row in poolAdvances"
            :key="row.matchId"
            class="space-y-2 rounded-lg border p-3"
          >
            <p class="text-sm font-semibold">
              {{ playerName(row.player1) }} — {{ playerName(row.player2) }}
            </p>
            <div class="flex gap-3">
              <label
                >Joueur 1<UInput
                  v-model.number="row.score1"
                  type="number"
                  min="0"
                  :max="Math.min(7, (state?.rules.pointsPerSet ?? 11) - 1)"
                  :aria-label="`Avance match ${row.matchId}, joueur 1`"
              /></label>
              <label
                >Joueur 2<UInput
                  v-model.number="row.score2"
                  type="number"
                  min="0"
                  :max="Math.min(7, (state?.rules.pointsPerSet ?? 11) - 1)"
                  :aria-label="`Avance match ${row.matchId}, joueur 2`"
              /></label>
            </div>
          </div>
          <UButton :loading="busy" @click="launchPool"
            >Lancer la poule et figer les avances</UButton
          >
        </div>
      </template>
    </UModal>
    <UModal
      v-model:open="modalOpen"
      :title="activeMatch ? matchLabel(activeMatch) : 'Match'"
      description="Lancez la rencontre, saisissez ses manches ou déclarez un forfait."
    >
      <template #body
        ><div v-if="activeMatch" class="space-y-4">
          <p class="font-semibold">
            {{ playerName(activeMatch.player1) }}<br />{{
              playerName(activeMatch.player2)
            }}
          </p>
          <UButton
            v-if="canSimulate(activeMatch)"
            variant="soft"
            icon="i-heroicons-beaker"
            :disabled="busy"
            @click="simulateDemo({ matchId: activeMatch.id })"
            >Simuler le résultat de ce match</UButton
          >
          <template v-if="activeMatch.status === 'pending'"
            ><p
              v-if="activeMatch.phase === 'pools'"
              class="text-sm text-gray-500"
            >
              Rencontre de poule : aucune table à affecter.
            </p>
            <label v-else
              >Table<UInput
                v-model.number="table"
                type="number"
                min="1"
                :max="snapshot?.tableCount"
            /></label>
            <div v-if="state?.rules.handicap">
              <label class="flex gap-2"
                ><input v-model="manualAdvance" type="checkbox" />Ajuster
                l’avance à chaque manche</label
              >
              <div class="mt-2 flex gap-3">
                <label
                  >Joueur 1<UInput
                    v-model.number="startScores[0]"
                    type="number"
                    min="0"
                    :max="Math.min(7, state.rules.pointsPerSet - 1)"
                    :disabled="!manualAdvance" /></label
                ><label
                  >Joueur 2<UInput
                    v-model.number="startScores[1]"
                    type="number"
                    min="0"
                    :max="Math.min(7, state.rules.pointsPerSet - 1)"
                    :disabled="!manualAdvance"
                /></label>
              </div>
            </div>
            <UButton :loading="busy" @click="launch"
              >Lancer et figer les règles</UButton
            ></template
          >
          <template v-else
            ><p>
              Départ de chaque manche :
              <strong>{{ activeMatch.rules?.startScores.join('–') }}</strong
              >. Les scores saisis incluent l’avance.
            </p>
            <form class="space-y-2" @submit.prevent="saveScore">
              <div
                v-for="(row, index) in setRows"
                :key="index"
                class="flex items-center gap-3"
              >
                <label class="w-20">Manche {{ index + 1 }}</label
                ><input
                  v-model.number="row.score1"
                  :aria-label="`Manche ${index + 1}, joueur 1`"
                  type="number"
                  min="0"
                  class="w-20 rounded border p-2"
                /><span>–</span
                ><input
                  v-model.number="row.score2"
                  :aria-label="`Manche ${index + 1}, joueur 2`"
                  type="number"
                  min="0"
                  class="w-20 rounded border p-2"
                />
              </div>
              <UButton type="submit" :loading="busy"
                >Enregistrer le score</UButton
              >
            </form></template
          >
          <div v-if="activeMatch.status !== 'finished'" class="border-t pt-3">
            <p class="mb-2 text-sm">
              Forfait : retire le perdant de cette série.
            </p>
            <div class="flex flex-wrap gap-2">
              <UButton
                color="neutral"
                variant="outline"
                @click="withdraw(activeMatch.player2!)"
                >Forfait joueur 1</UButton
              ><UButton
                color="neutral"
                variant="outline"
                @click="withdraw(activeMatch.player1!)"
                >Forfait joueur 2</UButton
              >
            </div>
          </div>
        </div></template
      >
    </UModal>
    <UModal
      v-model:open="launchModalOpen"
      :title="
        launchConfirmation?.confirmation === 'confirmPlayerConflict'
          ? 'Lancer malgré un joueur déjà engagé ?'
          : 'Lancer avant la fin du repos ?'
      "
      description="Le JA ou l’admin peut confirmer le lancement de cette rencontre ou de cette poule."
      :dismissible="!busy"
    >
      <template #body>
        <UAlert
          color="warning"
          variant="soft"
          icon="i-heroicons-exclamation-triangle"
          :title="launchConfirmation?.message"
          :description="
            launchConfirmation?.confirmation === 'confirmPlayerConflict'
              ? 'Vérifiez que les joueurs concernés sont disponibles ou que leurs rencontres pourront s’enchaîner. Les rencontres déjà ouvertes restent en cours.'
              : 'Confirmez que les joueurs concernés sont prêts à reprendre. Le temps de repos prévu reste inchangé pour les prochains matchs.'
          "
        />
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton
            color="neutral"
            variant="outline"
            :disabled="busy"
            @click="launchModalOpen = false"
          >
            Annuler
          </UButton>
          <UButton :loading="busy" @click="confirmLaunch">
            {{
              launchConfirmation?.confirmation === 'confirmPlayerConflict'
                ? 'Confirmer le lancement'
                : 'Confirmer le lancement anticipé'
            }}
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<style>
  .tournament-print .match-sheet-page {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-rows: repeat(2, minmax(0, 1fr));
    width: 194mm;
    height: 280mm;
    margin: 24px auto;
    padding: 0;
  }
  @media print {
    @page {
      size: A4 portrait;
      margin: 8mm;
    }
    body {
      display: block;
      margin: 0;
      min-height: 0;
    }
    body
      *:not(.tournament-print, .tournament-print *, :has(.tournament-print)) {
      display: none !important;
    }
    body *:has(.tournament-print) {
      display: contents !important;
    }
    .tournament-print {
      display: block !important;
      position: static;
      width: 100%;
      color: #000;
      background: #fff;
      font-size: 11px;
      padding: 0;
      border: 0;
      overflow: visible;
    }
    .tournament-print table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
    }
    .tournament-print td,
    .tournament-print th {
      border: 1px solid #777;
      padding: 8px;
    }
    .tournament-print h1 {
      font-size: 20px;
    }
    .tournament-print h2 {
      font-size: 16px;
      margin: 12px 0;
    }
    .tournament-print .print-sheet {
      page: auto;
      margin: 0;
      padding: 8mm 0;
      border: 0;
      break-after: page;
      break-inside: avoid;
    }
    .tournament-print .match-sheet-page {
      width: 100%;
      margin: 0;
      padding: 0;
    }
    .tournament-print > .print-sheet:last-child,
    .tournament-print > section:last-child > .print-sheet:last-child {
      break-after: auto;
    }
    .no-print {
      display: none !important;
    }
  }
</style>
