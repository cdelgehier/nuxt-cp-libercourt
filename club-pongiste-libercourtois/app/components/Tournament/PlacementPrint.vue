<script setup lang="ts">
  import { placementPrintPages } from '~/utils/tournament-placement-tree'
  import type {
    PlacementCard,
    PlacementLayout,
    PlacementRange
  } from '~/utils/tournament-placement-tree'
  import type {
    IntegralMatch,
    IntegralState,
    Source
  } from '~~/server/domains/tournament/integral'

  const props = defineProps<{
    state: IntegralState
    seriesName: string
    tournamentName: string
    registrations: {
      id: number
      firstName: string
      lastName: string
      partnerFirstName: string | null
      partnerLastName: string | null
      club?: string | null
      partnerClub?: string | null
    }[]
  }>()
  const pages = computed(function () {
    return placementPrintPages(props.state)
  })

  function scale(layout: PlacementLayout): number {
    // Leave room for the title and legend on an A4 landscape page.
    return Math.min(
      1,
      (281 * 96) / 25.4 / layout.width,
      (164 * 96) / 25.4 / layout.height
    )
  }
  function label(range: PlacementRange): string {
    return range.start === range.end
      ? `Place ${range.start}`
      : `Places ${range.start}–${range.end}`
  }
  function name(id: number | null): string {
    const player = props.registrations.find(function (entry) {
      return entry.id === id
    })
    if (!player) return 'À déterminer'
    return `${player.firstName} ${player.lastName}${player.partnerLastName ? ` / ${player.partnerFirstName ?? ''} ${player.partnerLastName}` : ''}`
  }
  function details(id: number | null): string {
    const entrant = props.state.entrants.find(function (entry) {
      return entry.id === id
    })
    const player = props.registrations.find(function (entry) {
      return entry.id === id
    })
    return [
      entrant?.ranking === null || entrant?.ranking === undefined
        ? null
        : `${entrant.ranking} pts`,
      player?.club
    ]
      .filter(Boolean)
      .join(' · ')
  }
  function sourceName(source: Source): string {
    return source.entrant !== undefined
      ? name(source.entrant)
      : `${source.outcome === 'winner' ? 'Gagnant' : 'Perdant'} du match ${source.match}`
  }
  function status(match: IntegralMatch): string {
    if (match.status === 'in_progress') return 'En cours'
    if (match.status === 'finished') return 'Terminé'
    if (match.status === 'forfeit') return 'Forfait'
    return 'À jouer'
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
  function qualification(card: PlacementCard): string {
    if (card.qualification === 'first') return `1er · Poule ${card.poolId}`
    if (card.qualification === 'second') return `2e · Poule ${card.poolId}`
    if (card.qualification === 'fourth') return `4e · Poule ${card.poolId}`
    return `${card.source?.outcome === 'winner' ? 'Gagnant' : 'Perdant'} du barrage ${card.source?.match}`
  }
</script>

<template>
  <div class="tree-print">
    <p v-if="!pages.length">
      Les arbres apparaîtront après validation des poules.
    </p>
    <article
      v-for="(page, index) in pages"
      :key="page.key"
      class="tree-print-page"
    >
      <header class="tree-print-heading">
        <p>
          {{ tournamentName }}{{ tournamentName ? ' · ' : '' }}{{ seriesName }}
        </p>
        <div class="tree-print-title">
          <h2>
            {{ page.title
            }}<span v-if="page.parts > 1">
              · {{ page.part }}/{{ page.parts }}</span
            >
          </h2>
          <span>Page {{ index + 1 }}/{{ pages.length }}</span>
        </div>
        <p>
          {{ state.rules.setsToWin }} manche(s) gagnante(s) ·
          {{ state.rules.pointsPerSet }} points · Perdants ← · → Gagnants
        </p>
      </header>
      <div
        class="tree-print-canvas"
        :style="{
          width: `${page.layout.width * scale(page.layout)}px`,
          height: `${page.layout.height * scale(page.layout)}px`
        }"
      >
        <div
          class="tree-print-diagram"
          :style="{
            width: `${page.layout.width}px`,
            height: `${page.layout.height}px`,
            transform: `scale(${scale(page.layout)})`
          }"
        >
          <svg
            class="tree-print-links"
            :width="page.layout.width"
            :height="page.layout.height"
            aria-hidden="true"
          >
            <path
              v-for="link in page.layout.links"
              :key="`${link.from}:${link.to}:${link.outcome}`"
              :d="link.path"
              fill="none"
              :stroke="link.outcome === 'winner' ? '#047857' : '#92400e'"
              stroke-width="1.5"
              :stroke-dasharray="link.playerId === null ? '5 4' : undefined"
            />
          </svg>
          <div
            v-for="column in page.layout.columns"
            :key="`${column.range.start}:${column.range.end}`"
            class="tree-print-column"
            :style="{ left: `${column.x}px` }"
          >
            <strong>{{
              column.title ??
              (column.outcome === 'loser'
                ? 'Perdants'
                : column.outcome === 'winner'
                  ? 'Gagnants'
                  : 'Rencontres de départ')
            }}</strong>
            <p>{{ label(column.range) }}</p>
          </div>
          <article
            v-for="card in page.layout.cards"
            :key="card.key"
            class="tree-print-card"
            :style="{
              left: `${card.x}px`,
              top: `${card.y}px`,
              width: `${card.width}px`,
              height: `${card.height}px`
            }"
          >
            <template v-if="card.match">
              <div class="tree-print-match-heading">
                <strong
                  >{{ card.match.phase === 'playoffs' ? 'Barrage' : 'Match' }}
                  {{ card.match.id }}</strong
                >
                <span
                  >{{ card.match.table ? `Table ${card.match.table} · ` : ''
                  }}{{ status(card.match) }}</span
                >
              </div>
              <div
                v-for="(id, side) in [card.match.player1, card.match.player2]"
                :key="side"
                class="tree-print-player"
                :class="{
                  'tree-print-winner': id !== null && card.match.winner === id
                }"
              >
                <div>
                  <strong
                    :class="{ 'tree-print-long-name': name(id).length >= 65 }"
                    >{{
                      id === null
                        ? sourceName(card.match.sources[side]!)
                        : name(id)
                    }}</strong
                  >
                  <p v-if="id !== null && name(id).length < 65">
                    {{ details(id) }}
                  </p>
                </div>
                <b>{{
                  card.match.sets.length ? setWins(card.match, side) : '–'
                }}</b>
              </div>
              <p class="tree-print-score">
                {{ score(card.match) || 'Résultat à venir' }}
              </p>
            </template>
            <div v-else class="tree-print-qualified">
              <strong>{{
                card.kind === 'qualifier'
                  ? qualification(card)
                  : card.kind === 'bye'
                    ? 'Exempté · Tour suivant →'
                    : label(card.range)
              }}</strong>
              <template v-if="card.kind === 'pending'">
                <p
                  v-for="id in card.waitingPlayers?.slice(0, 2)"
                  :key="id"
                  :class="{ 'tree-print-long-name': name(id).length >= 65 }"
                >
                  {{ name(id) }} · Qualifié
                </p>
                <p v-if="(card.waitingPlayers?.length ?? 0) > 2">
                  + {{ card.waitingPlayers!.length - 2 }} autres qualifiés
                </p>
                <p>En attente des résultats précédents.</p>
              </template>
              <template v-else>
                <p
                  :class="{
                    'tree-print-long-name': name(card.playerId).length >= 65
                  }"
                >
                  {{
                    card.playerId === null && card.kind === 'qualifier'
                      ? 'En attente du barrage'
                      : name(card.playerId)
                  }}
                </p>
                <p
                  v-if="
                    card.qualification === 'first' ||
                    card.qualification === 'second'
                  "
                  class="tree-print-direct"
                >
                  Qualifié directement
                </p>
              </template>
            </div>
          </article>
        </div>
      </div>
      <footer>
        Pointillés : résultat attendu · Chaque plage de places a sa propre page
        pour suivre la suite des rencontres.
      </footer>
    </article>
  </div>
</template>

<style scoped>
  .tree-print-page {
    page: tournament-tree;
    width: 281mm;
    height: 194mm;
    display: flex;
    flex-direction: column;
    align-items: center;
    break-inside: avoid;
    break-after: page;
    background: #fff;
    color: #111827;
    font-family: Arial, sans-serif;
    box-sizing: border-box;
    print-color-adjust: exact;
  }
  .tree-print-page p {
    margin: 0;
  }
  .tree-print-heading {
    width: 100%;
    margin-bottom: 3mm;
    font-size: 10px;
    line-height: 1.4;
  }
  .tree-print-title {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 12px;
  }
  .tree-print-title h2 {
    margin: 4px 0;
    font-size: 16px;
    font-weight: 700;
  }
  .tree-print-canvas {
    position: relative;
  }
  .tree-print-diagram {
    position: relative;
    transform-origin: top left;
  }
  .tree-print-links {
    position: absolute;
    inset: 0;
  }
  .tree-print-column {
    position: absolute;
    top: 0;
    width: 252px;
    text-align: center;
    font-size: 13px;
    line-height: 19px;
  }
  .tree-print-column p {
    font-size: 11px;
  }
  .tree-print-card {
    position: absolute;
    border: 1px solid #64748b;
    border-radius: 6px;
    background: #fff;
    box-sizing: border-box;
  }
  .tree-print-match-heading {
    height: 35px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    padding: 0 10px;
    border-bottom: 1px solid #cbd5e1;
    font-size: 10px;
  }
  .tree-print-match-heading span {
    text-align: right;
  }
  .tree-print-player {
    height: 43px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    padding: 0 10px;
    border-bottom: 1px solid #cbd5e1;
    box-sizing: border-box;
  }
  .tree-print-player div {
    min-width: 0;
  }
  .tree-print-player strong {
    display: block;
    font-size: 12px;
    line-height: 13px;
    overflow-wrap: anywhere;
  }
  .tree-print-player p {
    font-size: 9px;
    line-height: 11px;
  }
  .tree-print-player b {
    flex-shrink: 0;
    font-size: 14px;
  }
  .tree-print-winner {
    background: #ecfdf5;
  }
  .tree-print-score {
    padding: 2px 10px;
    font-size: 10px;
    line-height: 11px;
  }
  .tree-print-qualified {
    display: flex;
    height: 100%;
    flex-direction: column;
    justify-content: center;
    gap: 4px;
    padding: 6px 10px;
    box-sizing: border-box;
  }
  .tree-print-qualified strong {
    font-size: 11px;
  }
  .tree-print-qualified p {
    font-size: 12px;
    line-height: 14px;
    overflow-wrap: anywhere;
  }
  .tree-print-qualified .tree-print-direct {
    font-size: 10px;
    color: #047857;
  }
  .tree-print-card .tree-print-long-name {
    font-size: 10px;
    line-height: 11px;
  }
  .tree-print-page footer {
    width: 100%;
    margin-top: auto;
    padding-top: 2mm;
    font-size: 9px;
    color: #475569;
  }
  @media print {
    @page tournament-tree {
      size: A4 landscape;
      margin: 8mm;
    }
    .tree-print-page:last-child {
      break-after: auto;
    }
  }
</style>
