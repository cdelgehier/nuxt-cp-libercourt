<script setup lang="ts">
  import type {
    IntegralState,
    IntegralMatch,
    Source
  } from '~~/server/domains/tournament/integral'
  import {
    placementBranch,
    placementLayout,
    placementPlayerFocus,
    placementRanges,
    placementRoots,
    poolExitLayout
  } from '~/utils/tournament-placement-tree'
  import type {
    PlacementCard,
    PlacementRange
  } from '~/utils/tournament-placement-tree'

  const props = defineProps<{
    state: IntegralState
    registrations: {
      id: number
      firstName: string
      lastName: string
      partnerFirstName: string | null
      partnerLastName: string | null
      club?: string | null
      partnerClub?: string | null
    }[]
    editable: boolean
  }>()
  const emit = defineEmits<{ open: [match: IntegralMatch] }>()
  const rootKey = ref('')
  const rangeKey = ref('')
  const zoom = ref(0.8)
  const viewport = ref<HTMLElement | null>(null)
  const followedPlayer = ref<number | null>(null)
  const exitView = ref(props.state.phase === 'playoffs')
  const exitLayout = computed(function () {
    return poolExitLayout(props.state)
  })
  const showingExit = computed(function () {
    return Boolean(exitLayout.value && (exitView.value || !roots.value.length))
  })
  const roots = computed(function () {
    return placementRoots(props.state)
  })
  const root = computed(function () {
    return (
      roots.value.find(function (range) {
        return key(range) === rootKey.value
      }) ?? roots.value[0]
    )
  })
  const ranges = computed(function () {
    return root.value ? placementRanges(root.value) : []
  })
  const selected = computed(function () {
    return (
      ranges.value.find(function (range) {
        return key(range) === rangeKey.value
      }) ?? root.value
    )
  })
  const layout = computed(function () {
    if (showingExit.value) return exitLayout.value
    return selected.value ? placementLayout(props.state, selected.value) : null
  })

  function key(range: PlacementRange): string {
    return `${range.start}:${range.end}`
  }
  function label(range: PlacementRange): string {
    return range.start === range.end
      ? `Place ${range.start}`
      : `Places ${range.start}–${range.end}`
  }
  function selectRoot(range: PlacementRange): void {
    followedPlayer.value = null
    exitView.value = false
    rootKey.value = key(range)
    rangeKey.value = key(range)
    center()
  }
  async function selectRange(range: PlacementRange): Promise<void> {
    followedPlayer.value = null
    exitView.value = false
    rootKey.value = key(
      roots.value.find(function (entry) {
        return entry.start <= range.start && entry.end >= range.end
      })!
    )
    rangeKey.value = key(range)
    await center()
  }
  function selectExit(): void {
    followedPlayer.value = null
    exitView.value = true
    center()
  }
  async function followPlayer(id: number | null): Promise<void> {
    if (id === null) return
    const focus = placementPlayerFocus(props.state, id)
    if (!focus) return
    await selectRange(focus.range)
    followedPlayer.value = id
    const card = layout.value?.cards.find(function (entry) {
      return (
        (focus.matchId !== null && entry.match?.id === focus.matchId) ||
        entry.playerId === id ||
        entry.waitingPlayers?.includes(id)
      )
    })
    if (!card || !viewport.value) return
    viewport.value.scrollTo({
      left:
        (card.x + card.width / 2) * zoom.value - viewport.value.clientWidth / 2,
      top: card.y * zoom.value - 24,
      behavior: 'smooth'
    })
    const waitingRow = viewport.value.querySelector<HTMLElement>(
      `[data-waiting-player="${id}"]`
    )
    const waitingList = waitingRow?.parentElement
    if (waitingRow && waitingList)
      waitingList.scrollTo({
        top:
          waitingRow.offsetTop -
          (waitingList.clientHeight - waitingRow.offsetHeight) / 2,
        behavior: 'smooth'
      })
  }
  function isFollowed(card: PlacementCard): boolean {
    const id = followedPlayer.value
    return (
      id !== null &&
      (card.playerId === id ||
        card.match?.player1 === id ||
        card.match?.player2 === id ||
        Boolean(card.waitingPlayers?.includes(id)))
    )
  }
  function exitRange(outcome: 'winner' | 'loser'): PlacementRange {
    return exitLayout.value!.columns.find(function (column) {
      return column.outcome === outcome
    })!.range
  }
  function qualificationLabel(card: PlacementCard): string {
    if (card.qualification === 'first') return `1er · Poule ${card.poolId}`
    if (card.qualification === 'second') return `2e · Poule ${card.poolId}`
    if (card.qualification === 'fourth') return `4e · Poule ${card.poolId}`
    return `${card.source?.outcome === 'winner' ? 'Gagnant' : 'Perdant'} du barrage ${card.source?.match}`
  }
  async function center(): Promise<void> {
    await nextTick()
    const column = layout.value?.columns.find(function (entry) {
      return entry.outcome === null
    })
    if (!column || !viewport.value) return
    viewport.value.scrollTo({
      left: (column.x + 126) * zoom.value - viewport.value.clientWidth / 2,
      top: 0,
      behavior: 'smooth'
    })
  }
  function changeZoom(value: number): void {
    zoom.value = Math.max(0.4, Math.min(1.2, Math.round(value * 10) / 10))
    center()
  }
  onMounted(center)

  function name(id: number | null): string {
    const player = props.registrations.find(function (entry) {
      return entry.id === id
    })
    if (!player) return 'À déterminer'
    return `${player.firstName} ${player.lastName}${player.partnerLastName ? ` / ${player.partnerFirstName ?? ''} ${player.partnerLastName}` : ''}`
  }
  function details(id: number | null): string {
    if (id === null) return ''
    const player = props.registrations.find(function (entry) {
      return entry.id === id
    })
    const entrant = props.state.entrants.find(function (entry) {
      return entry.id === id
    })
    const clubs = [
      ...new Set([player?.club, player?.partnerClub].filter(Boolean))
    ].join(' / ')
    return [
      entrant?.ranking === null || entrant?.ranking === undefined
        ? null
        : `${entrant.ranking} pts`,
      clubs
    ]
      .filter(Boolean)
      .join(' · ')
  }
  function setWins(match: IntegralMatch, side: number): number {
    return match.sets.filter(function (set) {
      return side === 0 ? set.score1 > set.score2 : set.score2 > set.score1
    }).length
  }
  function score(match: IntegralMatch): string {
    return match.status === 'forfeit'
      ? 'Forfait'
      : match.sets
          .map(function (set) {
            return `${set.score1}–${set.score2}`
          })
          .join(' / ')
  }
  function status(match: IntegralMatch): string {
    if (match.status === 'in_progress') return 'En cours'
    if (match.status === 'finished') return 'Terminé'
    if (match.status === 'forfeit') return 'Forfait'
    return 'À lancer'
  }
  function sourceLabel(source: Source): string {
    if (source.entrant !== undefined) return name(source.entrant)
    return `${source.outcome === 'winner' ? 'Gagnant' : 'Perdant'} du match ${source.match}`
  }
  function actionLabel(match: IntegralMatch): string {
    return match.status === 'finished'
      ? 'Corriger'
      : match.status === 'in_progress'
        ? 'Saisir'
        : 'Lancer'
  }
  function canOpen(card: PlacementCard): boolean {
    return (
      props.editable &&
      card.match !== null &&
      card.match.status !== 'forfeit' &&
      card.match.player1 !== null &&
      card.match.player2 !== null
    )
  }
  function stage(range: PlacementRange, outcome: string | null): string {
    const size = range.end - range.start + 1
    if (size === 1) return label(range)
    if (outcome === null) return 'Rencontres de départ'
    const suffix = outcome === 'loser' ? ' de classement' : ''
    if (size === 2) return `Finale${suffix}`
    if (size <= 4) return `Demi-finales${suffix}`
    if (size <= 8) return `Quarts de finale${suffix}`
    return label(range)
  }
</script>

<template>
  <div class="space-y-4">
    <p v-if="!roots.length && !exitLayout" class="py-8 text-gray-500">
      La sortie de poules apparaîtra après validation des poules.
    </p>
    <template v-else>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-wrap gap-2" aria-label="Arbres de classement">
          <UButton
            v-if="exitLayout"
            :variant="showingExit ? 'solid' : 'outline'"
            :aria-pressed="showingExit"
            color="neutral"
            @click="selectExit"
            >Sortie de poules</UButton
          >
          <UButton
            v-for="range in roots"
            :key="key(range)"
            :variant="
              !showingExit && root && key(root) === key(range)
                ? 'solid'
                : 'outline'
            "
            :aria-pressed="!showingExit && root && key(root) === key(range)"
            color="neutral"
            @click="selectRoot(range)"
            >{{
              range.start === 1 ? 'Tableau principal' : 'Tableau de classement'
            }}
            · {{ label(range) }}</UButton
          >
        </div>
        <div class="flex items-center gap-2">
          <UButton
            icon="i-heroicons-minus"
            color="neutral"
            variant="outline"
            aria-label="Réduire l’arbre"
            :disabled="zoom <= 0.4"
            @click="changeZoom(zoom - 0.1)"
          />
          <span class="w-12 text-center text-sm tabular-nums"
            >{{ Math.round(zoom * 100) }} %</span
          >
          <UButton
            icon="i-heroicons-plus"
            color="neutral"
            variant="outline"
            aria-label="Agrandir l’arbre"
            :disabled="zoom >= 1.2"
            @click="changeZoom(zoom + 0.1)"
          />
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-heroicons-arrows-pointing-in"
            @click="center"
            >Centrer</UButton
          >
        </div>
      </div>
      <div
        class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900"
      >
        <p v-if="showingExit" class="max-w-2xl text-sm text-gray-500">
          Les premiers sont qualifiés directement. Les gagnants des barrages les
          rejoignent dans l’arbre supérieur ; les perdants et les quatrièmes
          vont dans l’arbre inférieur.
          {{
            state.phase === 'playoffs'
              ? 'Les adversaires suivants seront définis après validation des barrages par le JA.'
              : 'Les barrages sont validés. Choisissez une plage de places pour ouvrir son arbre.'
          }}
        </p>
        <nav
          v-else-if="root && selected"
          class="flex flex-wrap items-center gap-2 text-sm"
          aria-label="Position dans le tableau"
        >
          <UButton
            color="neutral"
            variant="ghost"
            :disabled="key(root) === key(selected)"
            @click="selectRoot(root)"
          >
            Tableau complet · {{ label(root) }}
          </UButton>
          <template v-if="key(root) !== key(selected)">
            <span aria-hidden="true">/</span>
            <span class="font-semibold" aria-current="page">{{
              label(selected)
            }}</span>
          </template>
          <span
            v-if="followedPlayer !== null"
            class="rounded-full bg-blue-50 px-3 py-1 text-blue-800 dark:bg-blue-950 dark:text-blue-200"
            >Suivi : {{ name(followedPlayer) }}</span
          >
        </nav>
        <p class="text-sm text-gray-500">
          <span class="text-amber-700 dark:text-amber-400">← Perdants</span
          ><span class="mx-3">·</span
          ><span class="text-emerald-700 dark:text-emerald-400"
            >Gagnants →</span
          >
        </p>
      </div>
      <div
        v-if="layout"
        ref="viewport"
        class="placement-viewport overflow-auto rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950"
        tabindex="0"
        role="region"
        :aria-label="
          showingExit
            ? 'Sortie de poules : barrages et qualifiés'
            : `Arbre de classement : ${selected ? label(selected) : ''}`
        "
      >
        <div
          class="mx-auto"
          :style="{
            width: `${layout.width * zoom}px`,
            height: `${layout.height * zoom}px`
          }"
        >
          <div
            class="relative origin-top-left"
            :style="{
              width: `${layout.width}px`,
              height: `${layout.height}px`,
              transform: `scale(${zoom})`
            }"
          >
            <svg
              class="pointer-events-none absolute inset-0"
              :width="layout.width"
              :height="layout.height"
              aria-hidden="true"
            >
              <path
                v-for="link in layout.links"
                :key="`${link.from}:${link.to}:${link.outcome}`"
                :d="link.path"
                fill="none"
                :class="
                  link.outcome === 'winner'
                    ? 'stroke-emerald-500'
                    : 'stroke-amber-500'
                "
                stroke-width="1.5"
                :stroke-dasharray="link.playerId === null ? '5 4' : undefined"
              />
            </svg>
            <div
              v-for="column in layout.columns"
              :key="key(column.range)"
              class="absolute top-0 text-center"
              :style="{ left: `${column.x}px`, width: '252px' }"
            >
              <p
                class="text-sm font-semibold"
                :class="
                  column.outcome === 'winner'
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : column.outcome === 'loser'
                      ? 'text-amber-700 dark:text-amber-400'
                      : ''
                "
              >
                {{ column.title ?? stage(column.range, column.outcome) }}
              </p>
              <UButton
                v-if="
                  !showingExit &&
                  column.outcome !== null &&
                  column.range.start !== column.range.end
                "
                class="mt-1"
                color="neutral"
                variant="ghost"
                size="xs"
                @click="selectRange(column.range)"
                >{{ label(column.range) }} ↗</UButton
              >
              <p
                v-else-if="
                  column.range.start !== column.range.end ||
                  (showingExit && column.outcome !== null)
                "
                class="mt-1 text-xs text-gray-500"
              >
                {{ label(column.range) }}
              </p>
            </div>
            <article
              v-for="card in layout.cards"
              :key="card.key"
              class="placement-card absolute flex flex-col rounded-lg border bg-white shadow-sm dark:bg-gray-900"
              :class="{
                'border-emerald-400': card.match?.status === 'in_progress',
                'border-gray-200 dark:border-gray-700':
                  card.match?.status !== 'in_progress',
                'ring-2 ring-blue-600': isFollowed(card)
              }"
              :style="{
                left: `${card.x}px`,
                top: `${card.y}px`,
                width: `${card.width}px`,
                height: `${card.height}px`
              }"
            >
              <template v-if="card.match">
                <div
                  class="flex items-center justify-between border-b border-gray-100 px-3 py-2 text-xs dark:border-gray-800"
                >
                  <span class="font-semibold text-gray-500"
                    >{{ showingExit ? 'Barrage' : 'Match' }}
                    {{ card.match.id }}</span
                  >
                  <span
                    :class="
                      card.match.status === 'in_progress'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-gray-500'
                    "
                    >{{ card.match.table ? `Table ${card.match.table} · ` : ''
                    }}{{ status(card.match) }}</span
                  >
                </div>
                <div
                  v-for="(id, side) in [card.match.player1, card.match.player2]"
                  :key="side"
                  class="flex min-h-[43px] items-center gap-2 border-b border-gray-100 px-3 py-1 dark:border-gray-800"
                  :class="
                    card.match.winner === id && id !== null
                      ? 'bg-emerald-50 dark:bg-emerald-950/30'
                      : ''
                  "
                >
                  <div class="min-w-0 flex-1">
                    <button
                      type="button"
                      class="block max-w-full truncate text-left text-sm font-semibold hover:text-blue-700 hover:underline focus-visible:underline"
                      :disabled="id === null || !roots.length"
                      :aria-label="`Suivre ${name(id)} dans le tableau`"
                      :title="name(id)"
                      @click="followPlayer(id)"
                    >
                      {{
                        id === null
                          ? sourceLabel(card.match.sources[side]!)
                          : name(id)
                      }}
                    </button>
                    <p
                      class="truncate text-[10px] text-gray-500"
                      :title="details(id)"
                    >
                      {{ details(id) || ' ' }}
                    </p>
                  </div>
                  <span class="text-sm font-bold tabular-nums">{{
                    card.match.sets.length ? setWins(card.match, side) : '–'
                  }}</span>
                </div>
                <div
                  class="flex flex-1 items-center justify-between gap-2 px-3 py-1"
                >
                  <p
                    class="truncate text-[11px] text-gray-500"
                    :title="score(card.match)"
                  >
                    {{ score(card.match) || 'Résultat à venir' }}
                  </p>
                  <UButton
                    v-if="canOpen(card)"
                    size="xs"
                    color="neutral"
                    variant="outline"
                    :aria-label="`${actionLabel(card.match)} le match ${card.match.id}`"
                    @click="emit('open', card.match)"
                    >{{ actionLabel(card.match) }}</UButton
                  >
                </div>
                <div
                  v-if="showingExit"
                  class="flex justify-between border-t border-gray-100 px-2 py-2 text-[11px] dark:border-gray-800"
                >
                  <span class="text-amber-700 dark:text-amber-400"
                    >← {{ label(exitRange('loser')) }}</span
                  >
                  <span class="text-emerald-700 dark:text-emerald-400"
                    >{{ label(exitRange('winner')) }} →</span
                  >
                </div>
                <div
                  v-else
                  class="flex justify-between border-t border-gray-100 px-2 py-1 dark:border-gray-800"
                >
                  <UButton
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    :aria-label="`Branche des perdants du match ${card.match.id} : ${label(placementBranch(card.range, 'loser'))}`"
                    class="text-amber-700 dark:text-amber-300"
                    @click="selectRange(placementBranch(card.range, 'loser'))"
                    >←
                    {{ label(placementBranch(card.range, 'loser')) }}</UButton
                  >
                  <UButton
                    color="success"
                    variant="ghost"
                    size="xs"
                    :aria-label="`Branche des gagnants du match ${card.match.id} : ${label(placementBranch(card.range, 'winner'))}`"
                    @click="selectRange(placementBranch(card.range, 'winner'))"
                    >{{
                      label(placementBranch(card.range, 'winner'))
                    }}
                    →</UButton
                  >
                </div>
              </template>
              <div
                v-else-if="card.kind === 'qualifier'"
                class="flex h-full flex-col justify-center gap-1 border-l-4 px-3"
                :class="
                  card.range.start === 1
                    ? 'border-emerald-400'
                    : 'border-amber-400'
                "
              >
                <p class="text-[11px] font-semibold text-gray-500">
                  {{ qualificationLabel(card) }}
                </p>
                <button
                  type="button"
                  class="truncate text-sm font-semibold"
                  :class="
                    roots.length && card.playerId !== null
                      ? 'text-left hover:text-blue-700 hover:underline'
                      : 'text-left'
                  "
                  :disabled="!roots.length || card.playerId === null"
                  :aria-label="`Suivre ${name(card.playerId)} dans le tableau`"
                  :title="name(card.playerId)"
                  @click="followPlayer(card.playerId)"
                >
                  {{
                    card.playerId === null
                      ? 'En attente du barrage'
                      : name(card.playerId)
                  }}
                </button>
                <p
                  v-if="card.playerId !== null"
                  class="truncate text-[10px] text-gray-500"
                  :title="details(card.playerId)"
                >
                  {{ details(card.playerId) }}
                </p>
                <p
                  v-if="
                    card.qualification === 'first' ||
                    card.qualification === 'second'
                  "
                  class="text-[10px] text-emerald-700 dark:text-emerald-400"
                >
                  {{
                    state.phase === 'playoffs'
                      ? 'Qualifié · En attente des barrages'
                      : 'Qualifié directement'
                  }}
                </p>
              </div>
              <button
                v-else-if="card.kind === 'bye'"
                type="button"
                class="flex h-full w-full flex-col items-center justify-center gap-3 px-4 text-center hover:bg-blue-50 dark:hover:bg-blue-950"
                :aria-label="`Suivre ${name(card.playerId)} vers ${label(placementBranch(card.range, 'winner'))}`"
                @click="followPlayer(card.playerId)"
              >
                <UIcon
                  name="i-heroicons-arrow-right-circle"
                  class="size-6 text-blue-600"
                />
                <span class="font-semibold">Exempté</span>
                <span class="text-sm">{{ name(card.playerId) }}</span>
                <span
                  class="text-sm font-medium text-blue-700 dark:text-blue-300"
                  >Voir
                  {{ label(placementBranch(card.range, 'winner')) }} →</span
                >
                <span class="text-xs text-gray-500"
                  >Passe au tour suivant sans jouer.</span
                >
              </button>
              <div
                v-else
                class="flex h-full min-h-0 flex-col items-center justify-center px-4 text-center"
                :class="card.kind === 'pending' ? 'gap-2 py-3' : 'gap-3'"
              >
                <UIcon
                  :name="
                    card.kind === 'place'
                      ? 'i-heroicons-trophy'
                      : 'i-heroicons-clock'
                  "
                  class="size-6 shrink-0 text-gray-400"
                />
                <p class="shrink-0 font-semibold">
                  {{ label(card.range) }}
                </p>
                <p v-if="card.kind === 'place'" class="text-sm">
                  {{ name(card.playerId) }}
                </p>
                <template v-else-if="card.kind === 'pending'">
                  <div
                    v-if="card.waitingPlayers?.length"
                    role="list"
                    tabindex="0"
                    :aria-label="`Qualifiés en attente · ${label(card.range)}`"
                    class="relative min-h-0 w-full flex-1 overflow-y-auto rounded border border-slate-200 px-2 dark:border-slate-700"
                  >
                    <p
                      v-for="id in card.waitingPlayers"
                      :key="id"
                      role="listitem"
                      :data-waiting-player="id"
                      class="break-words py-1 text-sm font-semibold"
                      :class="{
                        'bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-200':
                          followedPlayer === id
                      }"
                    >
                      {{ name(id) }} · Qualifié
                    </p>
                  </div>
                  <p class="shrink-0 text-xs text-gray-500">
                    {{
                      card.waitingPlayers?.length
                        ? `${card.waitingPlayers.length} qualifié${card.waitingPlayers.length > 1 ? 's' : ''} · En attente des autres joueurs.`
                        : 'En attente des résultats précédents.'
                    }}
                  </p>
                </template>
              </div>
            </article>
          </div>
        </div>
      </div>
      <p v-if="!showingExit" class="text-xs text-gray-500">
        Cliquez sur un joueur pour retrouver sa rencontre actuelle, ou sur une
        plage de places pour avancer dans le tableau. « Tableau complet » permet
        de revenir au départ.
      </p>
      <p v-else class="text-xs text-gray-500">
        Les traits en pointillés attendent les résultats des barrages. Cette vue
        présente les qualifiés ; le classement des têtes de série fixe les
        rencontres suivantes à la validation du JA.
      </p>
    </template>
  </div>
</template>

<style scoped>
  .placement-viewport {
    max-height: 72vh;
  }
  .placement-card {
    overflow: hidden;
  }
</style>
