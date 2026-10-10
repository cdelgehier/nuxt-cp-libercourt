<script setup lang="ts">
  import { scoreInput } from '~/utils/tournament-score'
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
  }
  const props = withDefaults(
    defineProps<{
      slug: string
      seriesId: number
      apiBase?: string
      publicView?: boolean
    }>(),
    { apiBase: '/api/ja/tournois', publicView: false }
  )
  const emit = defineEmits<{ refresh: [] }>()
  const toast = useToast()
  const endpoint = computed(function () {
    return `${props.apiBase}/${props.slug}/series/${props.seriesId}/integral`
  })
  const { data: snapshot, error, refresh } = await useFetch<Snapshot>(endpoint)
  const scheduleEndpoint = computed(function () {
    return `${props.apiBase}/${props.slug}/schedule`
  })
  const { data: schedule, refresh: refreshSchedule } =
    await useFetch<Awaited<ReturnType<typeof getTournamentSchedule>>>(
      scheduleEndpoint
    )
  const scheduledMatches = computed(function () {
    return (schedule.value?.matches ?? []).filter(function (match) {
      return (
        !search.value.trim() ||
        `${match.player1Name} ${match.player2Name} ${match.player1Club} ${match.player2Club} ${match.seriesName}`
          .toLowerCase()
          .includes(search.value.trim().toLowerCase())
      )
    })
  })
  const state = computed(function () {
    return snapshot.value?.state ?? null
  })
  const tab = ref('pools')
  const busy = ref(false)
  const selectedPlayer = ref<number | null>(null)
  const activeMatch = ref<IntegralMatch | null>(null)
  const modalOpen = ref(false)
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
  const printPreview = ref(false)
  const search = ref('')
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
      return matchesSearch(match.player1) || matchesSearch(match.player2)
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
  const readyMatches = computed(function () {
    return (
      state.value?.matches.filter(function (match) {
        return match.player1 !== null && match.player2 !== null
      }) ?? []
    )
  })
  const placementGroups = computed(function () {
    const nodes = state.value?.nodes ?? []
    return [...nodes].sort(function (a, b) {
      return b.end - b.start - (a.end - a.start) || a.start - b.start
    })
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
  function time(value: string | null): string {
    return value
      ? new Date(value).toLocaleString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      : '—'
  }
  function matchLabel(
    match: Pick<IntegralMatch, 'phase' | 'poolId' | 'rangeStart' | 'rangeEnd'>
  ): string {
    if (match.phase === 'pools') return `Poule ${match.poolId}`
    return match.phase === 'playoffs'
      ? 'Barrage'
      : `Places ${match.rangeStart}–${match.rangeEnd}`
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
  function matchesInRange(start: number, end: number) {
    return (
      state.value?.matches.filter(function (match) {
        return match.rangeStart === start && match.rangeEnd === end
      }) ?? []
    )
  }
  function destination(
    match: IntegralMatch,
    outcome: 'winner' | 'loser'
  ): string {
    const node = state.value?.nodes.find(function (entry) {
      return entry.sources.some(function (source) {
        return source.match === match.id && source.outcome === outcome
      })
    })
    if (!node) return ''
    return node.start === node.end
      ? `Place ${node.start}`
      : `Places ${node.start}–${node.end}`
  }
  async function command(
    action: string,
    body: Record<string, unknown> = {}
  ): Promise<void> {
    busy.value = true
    try {
      snapshot.value = await $fetch<Snapshot>(endpoint.value, {
        method: 'POST',
        body: { action, version: snapshot.value?.version ?? 0, ...body }
      })
      await refreshSchedule()
      emit('refresh')
    } catch (error: unknown) {
      toast.add({
        title:
          (error as { data?: { message?: string } })?.data?.message ??
          'Action impossible',
        color: 'error'
      })
      await refresh()
      throw error
    } finally {
      busy.value = false
    }
  }
  async function generate(): Promise<void> {
    try {
      await command('generate')
    } catch {
      /* shown by command */
    }
  }
  async function drop(): Promise<void> {
    try {
      await command('drop')
    } catch {
      /* shown by command */
    }
  }
  async function swap(id: number): Promise<void> {
    if (state.value?.phase !== 'ready' || props.publicView) return
    if (selectedPlayer.value === null) {
      selectedPlayer.value = id
      return
    }
    const first = selectedPlayer.value
    selectedPlayer.value = null
    if (first === id) return
    try {
      await command('swap', { first, second: id })
    } catch {
      /* shown by command */
    }
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
  function openMatch(match: IntegralMatch): void {
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
  function openScheduledMatch(id: number): void {
    const match = state.value?.matches.find(function (entry) {
      return entry.id === id
    })
    if (match) openMatch(match)
  }
  async function launch(): Promise<void> {
    if (!activeMatch.value) return
    const id = activeMatch.value.id
    try {
      await command('start', {
        matchId: id,
        table: table.value,
        ...(state.value?.rules.handicap && manualAdvance.value
          ? { startScores: [...startScores] }
          : {})
      })
      activeMatch.value =
        state.value?.matches.find(function (match) {
          return match.id === id
        }) ?? null
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
  function print(): void {
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
  <div class="integral-board space-y-5">
    <UAlert
      v-if="error"
      color="error"
      title="Chargement impossible"
      :description="error.data?.message ?? 'Actualisez la page.'"
    />
    <div class="no-print flex flex-wrap items-center gap-3">
      <UBadge color="primary"
        >Tournoi intégral · {{ phaseLabels[state?.phase ?? 'ready'] }}</UBadge
      >
      <span v-if="snapshot" class="text-sm"
        >{{ snapshot.series.setsToWin }} manche(s) gagnante(s) ·
        {{ snapshot.series.pointsPerSet }} points<span
          v-if="state?.rules.handicap"
        >
          · handicap à chaque manche</span
        ></span
      >
      <UButton
        v-if="!publicView && (!state || state.phase === 'ready')"
        :loading="busy"
        @click="generate"
        >{{ state ? 'Régénérer les poules' : 'Générer les poules' }}</UButton
      >
      <UButton
        v-if="!publicView && state?.phase === 'ready'"
        color="neutral"
        variant="outline"
        @click="drop"
        >Annuler les poules</UButton
      >
      <UButton
        v-if="
          !publicView &&
          state &&
          ['ready', 'pools', 'playoffs'].includes(state.phase)
        "
        :loading="busy"
        @click="advance"
        >{{
          state.phase === 'ready'
            ? 'Démarrer la série'
            : state.phase === 'pools'
              ? 'Valider les poules et ouvrir les barrages'
              : 'Valider les barrages et ouvrir les arbres'
        }}</UButton
      >
      <select
        v-model="printMode"
        aria-label="Feuilles à imprimer"
        class="rounded border p-2 text-sm"
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
    </div>
    <p v-if="!state" class="text-gray-500">
      Les poules seront affichées après leur génération.
    </p>
    <template v-else>
      <UInput
        v-model="search"
        aria-label="Rechercher un joueur ou un club"
        placeholder="Rechercher un joueur ou un club"
        class="no-print w-full max-w-sm"
      />
      <nav class="no-print flex flex-wrap gap-2" aria-label="Phases du tournoi">
        <UButton
          v-for="item in [
            { id: 'pools', label: 'Poules' },
            { id: 'playoffs', label: 'Barrages' },
            { id: 'trees', label: 'Arbres' },
            { id: 'ranking', label: 'Classement' },
            { id: 'matches', label: 'Matchs' },
            { id: 'schedule', label: 'Planning' }
          ]"
          :key="item.id"
          :variant="tab === item.id ? 'solid' : 'outline'"
          color="neutral"
          @click="tab = item.id"
          >{{ item.label }}</UButton
        >
      </nav>
      <section v-if="tab === 'pools'" class="no-print space-y-4">
        <p
          v-if="state.phase === 'ready' && !publicView"
          class="text-sm text-amber-600"
        >
          Sélectionnez deux joueurs pour les échanger entre les poules.
        </p>
        <div class="grid gap-4 lg:grid-cols-2">
          <article
            v-for="pool in displayedPools"
            :key="pool.id"
            class="overflow-x-auto rounded-xl border p-4"
          >
            <h3 class="mb-3 font-bold">Poule {{ pool.id }}</h3>
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
                      class="text-left"
                      :class="{
                        'text-primary font-bold': selectedPlayer === row.id
                      }"
                      :disabled="publicView || state.phase !== 'ready'"
                      @click="swap(row.id)"
                    >
                      {{ playerName(row.id) }}</button
                    ><span
                      v-if="
                        row.tied && state.phase === 'pools' && hasTie(pool.id)
                      "
                      class="ml-2 text-amber-600"
                      >Égalité à valider</span
                    ><small class="block text-gray-500">{{
                      playerClub(row.id)
                    }}</small>
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
                  v-if="
                    !publicView &&
                    state.phase !== 'ready' &&
                    match.status !== 'forfeit'
                  "
                  size="xs"
                  variant="outline"
                  @click="openMatch(match)"
                  >{{
                    match.status === 'finished'
                      ? 'Corriger'
                      : match.status === 'in_progress'
                        ? 'Saisir'
                        : 'Lancer'
                  }}</UButton
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
          class="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4"
        >
          <span
            >{{ playerName(match.player1) }} — {{ playerName(match.player2) }}
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
        <div v-if="tab === 'schedule'" class="overflow-x-auto">
          <p class="mb-3 font-medium">Planning de toutes les séries</p>
          <table class="w-full text-sm">
            <thead>
              <tr>
                <th class="p-3 text-left">Heure / table</th>
                <th class="text-left">Série / phase</th>
                <th class="text-left">Joueurs</th>
                <th class="text-left">État</th>
                <th v-if="!publicView">Poste JA</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="match in scheduledMatches"
                :key="`${match.seriesId}:${match.id}`"
                class="border-t"
              >
                <td class="p-3">
                  {{ time(match.scheduledAt) }} · {{ match.table ?? '—' }}
                </td>
                <td>{{ match.seriesName }}<br />{{ matchLabel(match) }}</td>
                <td>{{ match.player1Name }}<br />{{ match.player2Name }}</td>
                <td>
                  {{
                    match.status === 'in_progress'
                      ? 'En cours'
                      : match.status === 'finished'
                        ? 'Terminé'
                        : match.status === 'forfeit'
                          ? 'Forfait'
                          : 'À jouer'
                  }}
                </td>
                <td v-if="!publicView">
                  <UButton
                    v-if="
                      match.seriesId === seriesId &&
                      state.phase !== 'ready' &&
                      match.status !== 'forfeit'
                    "
                    size="sm"
                    @click="openScheduledMatch(match.id)"
                    >Ouvrir</UButton
                  ><span
                    v-else-if="match.seriesId !== seriesId"
                    class="text-gray-500"
                    >Sélectionner cette série</span
                  >
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full text-sm">
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
                  {{ match.table ?? '—' }} · {{ time(match.scheduledAt) }}
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
                    v-if="state.phase !== 'ready' && match.status !== 'forfeit'"
                    size="sm"
                    @click="openMatch(match)"
                    >{{
                      match.status === 'finished'
                        ? 'Corriger'
                        : match.status === 'in_progress'
                          ? 'Saisir'
                          : 'Lancer'
                    }}</UButton
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

      <UButton
        class="no-print"
        color="neutral"
        variant="outline"
        @click="printPreview = !printPreview"
        >{{ printPreview ? 'Fermer l’aperçu' : 'Aperçu des feuilles' }}</UButton
      >
      <div
        class="tournament-print"
        :class="printPreview ? 'print-preview' : 'hidden'"
      >
        <h1>{{ snapshot?.series.name }} · Tournoi intégral</h1>
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
                  <td>{{ match.table }} {{ time(match.scheduledAt) }}</td>
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
          <article
            v-for="match in readyMatches"
            :key="match.id"
            class="print-sheet"
          >
            <h2>{{ matchLabel(match) }} · Match {{ match.id }}</h2>
            <p>
              Table {{ match.table ?? '____' }} · {{ time(match.scheduledAt) }}
            </p>
            <p>
              {{ match.rules?.setsToWin ?? state.rules.setsToWin }} manches
              gagnantes ·
              {{ match.rules?.pointsPerSet ?? state.rules.pointsPerSet }} points
              · 2 points d’écart
            </p>
            <p>
              Départ de chaque manche :
              {{
                match.rules?.startScores.join('–') ??
                (state.rules.handicap
                  ? 'À valider et figer par le JA avant le match'
                  : '0–0')
              }}
            </p>
            <table>
              <thead>
                <tr>
                  <th>Joueur / paire</th>
                  <th
                    v-for="number in (match.rules?.setsToWin ??
                      state.rules.setsToWin) *
                      2 -
                    1"
                    :key="number"
                  >
                    Manche {{ number }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{{ playerName(match.player1) }}</td>
                  <td
                    v-for="number in (match.rules?.setsToWin ??
                      state.rules.setsToWin) *
                      2 -
                    1"
                    :key="number"
                  >
                    {{ match.sets[number - 1]?.score1 ?? '____' }}
                  </td>
                </tr>
                <tr>
                  <td>{{ playerName(match.player2) }}</td>
                  <td
                    v-for="number in (match.rules?.setsToWin ??
                      state.rules.setsToWin) *
                      2 -
                    1"
                    :key="number"
                  >
                    {{ match.sets[number - 1]?.score2 ?? '____' }}
                  </td>
                </tr>
              </tbody>
            </table>
            <p>
              Vainqueur :
              {{
                match.winner ? playerName(match.winner) : '____________________'
              }}
              · Signature arbitre : ______________
            </p>
          </article>
        </section>
        <section
          v-if="printMode === 'all' || printMode === 'trees'"
          class="print-sheet"
        >
          <h2>Barrages et arbres de classement</h2>
          <article v-for="match in playoffMatches" :key="match.id">
            <p>
              {{ playerName(match.player1) }} —
              {{ playerName(match.player2) }} :
              {{ matchScore(match) || '____________' }}
            </p>
          </article>
          <article
            v-for="node in placementGroups"
            :key="`${node.start}:${node.end}`"
          >
            <h3>
              {{ node.start === node.end ? 'Place' : 'Places' }} {{ node.start
              }}{{ node.end === node.start ? '' : `–${node.end}` }}
            </h3>
            <p
              v-for="match in matchesInRange(node.start, node.end)"
              :key="match.id"
            >
              {{ playerName(match.player1) }} —
              {{ playerName(match.player2) }} :
              {{ matchScore(match) || '____________' }} · Gagnant →
              {{ destination(match, 'winner') }} · Perdant →
              {{ destination(match, 'loser') }}
            </p>
          </article>
        </section>
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
          <h2>Planning de toutes les séries</h2>
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
                v-for="match in schedule?.matches ?? []"
                :key="`${match.seriesId}:${match.id}`"
              >
                <td>{{ time(match.scheduledAt) }}</td>
                <td>{{ match.table }}</td>
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
      v-model:open="modalOpen"
      :title="activeMatch ? matchLabel(activeMatch) : 'Match'"
    >
      <template #body
        ><div v-if="activeMatch" class="space-y-4">
          <p class="font-semibold">
            {{ playerName(activeMatch.player1) }}<br />{{
              playerName(activeMatch.player2)
            }}
          </p>
          <template v-if="activeMatch.status === 'pending'"
            ><label
              >Table<UInput v-model.number="table" type="number" min="1"
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
                color="warning"
                variant="outline"
                @click="withdraw(activeMatch.player2!)"
                >Forfait joueur 1</UButton
              ><UButton
                color="warning"
                variant="outline"
                @click="withdraw(activeMatch.player1!)"
                >Forfait joueur 2</UButton
              >
            </div>
          </div>
        </div></template
      >
    </UModal>
  </div>
</template>

<style>
  .print-preview {
    color: #111;
    background: white;
    padding: 24px;
    border: 1px solid #aaa;
  }
  .print-preview table {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
  }
  .print-preview td,
  .print-preview th {
    border: 1px solid #777;
    padding: 6px;
  }
  .print-preview .print-sheet {
    margin: 24px 0;
    padding: 16px;
    border: 1px solid #ccc;
  }
  @media print {
    body * {
      visibility: hidden;
    }
    .tournament-print,
    .tournament-print * {
      visibility: visible;
    }
    .tournament-print {
      display: block !important;
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      color: #000;
      background: #fff;
      font-size: 11px;
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
    .print-sheet {
      break-after: page;
      break-inside: avoid;
    }
    .no-print {
      display: none !important;
    }
  }
</style>
