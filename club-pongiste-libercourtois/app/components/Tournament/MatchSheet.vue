<script setup lang="ts">
  import { matchTimeLabel } from '~/utils/tournament-schedule'
  import type {
    IntegralMatch,
    Rules
  } from '~~/server/domains/tournament/integral'

  interface SheetPlayer {
    name: string
    club: string
    ranking: number | null
  }
  const props = defineProps<{
    title: string
    tournamentName: string
    seriesName: string
    match: IntegralMatch
    rules: Rules
    players: [SheetPlayer, SheetPlayer]
  }>()
  const matchRules = computed(function () {
    return props.match.rules ?? props.rules
  })
  const scheduledTime = computed(function () {
    return matchTimeLabel(props.match, true) || '________'
  })
</script>

<template>
  <article class="match-sheet">
    <header class="match-sheet-header">
      <p v-if="tournamentName" class="sheet-tournament">{{ tournamentName }}</p>
      <h2>{{ title }}</h2>
      <p class="sheet-series">Série : {{ seriesName }}</p>
      <p class="sheet-details">
        <span>Table : {{ match.table ?? '________' }}</span>
        <span>Heure : {{ scheduledTime }}</span>
        <span v-if="match.phase === 'placement'">
          Places {{ match.rangeStart }}–{{ match.rangeEnd }}
        </span>
      </p>
    </header>
    <p class="sheet-rules">
      {{ matchRules.setsToWin }} manche(s) gagnante(s) ·
      {{ matchRules.pointsPerSet }} points · 2 points d’écart
    </p>
    <p class="sheet-start">
      Départ de chaque manche :
      {{
        match.rules?.startScores.join('–') ??
        (rules.handicap ? 'À valider par le JA avant le lancement' : '0–0')
      }}
    </p>
    <table class="score-grid">
      <colgroup>
        <col class="sheet-player-column" />
        <col v-for="number in matchRules.setsToWin * 2 - 1" :key="number" />
      </colgroup>
      <thead>
        <tr>
          <th scope="col" class="sheet-player-heading">Joueur / paire</th>
          <th
            v-for="number in matchRules.setsToWin * 2 - 1"
            :key="number"
            scope="col"
          >
            {{ number }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(player, index) in players" :key="index">
          <th scope="row" class="sheet-player">
            <strong>{{ player.name }}</strong>
            <span>{{ player.club || 'Club non renseigné' }}</span>
            <span>{{ player.ranking ?? 'Non renseignés' }} points FFTT</span>
          </th>
          <td v-for="number in matchRules.setsToWin * 2 - 1" :key="number">
            {{
              index === 0
                ? match.sets[number - 1]?.score1
                : match.sets[number - 1]?.score2
            }}
          </td>
        </tr>
      </tbody>
    </table>
    <footer class="sheet-footer">
      <p>
        Vainqueur :
        {{
          match.winner === match.player1
            ? players[0].name
            : match.winner === match.player2
              ? players[1].name
              : '________________________'
        }}
        <span v-if="match.status === 'forfeit'"> · Forfait</span>
      </p>
      <div class="sheet-signature">Signature de l’arbitre</div>
    </footer>
  </article>
</template>

<style scoped>
  .match-sheet {
    min-width: 0;
    padding: 4mm;
    border: 1px dashed #ccc;
    color: #111;
    background: #fff;
    font-size: 12px;
    line-height: 1.35;
    overflow-wrap: anywhere;
  }
  .match-sheet-header h2 {
    margin: 6px 0;
    font-size: 16px;
    font-weight: 700;
  }
  .sheet-tournament {
    font-size: 10px;
  }
  .sheet-series {
    font-weight: 600;
  }
  .sheet-details {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 12px;
    margin: 8px 0;
  }
  .sheet-start {
    margin-top: 4px;
  }
  .match-sheet table.score-grid {
    width: 100%;
    table-layout: fixed;
    border-collapse: collapse;
    margin: 12px 0;
  }
  .sheet-player-column {
    width: 48%;
  }
  .match-sheet .score-grid th,
  .match-sheet .score-grid td {
    border: 1px solid #111;
    padding: 4px;
    text-align: center;
  }
  .match-sheet .score-grid .sheet-player-heading,
  .match-sheet .score-grid .sheet-player {
    text-align: left;
  }
  .sheet-player {
    height: 22mm;
    font-weight: 400;
    overflow-wrap: anywhere;
  }
  .sheet-player strong {
    font-size: 13px;
  }
  .sheet-player span {
    display: block;
    margin-top: 3px;
    font-size: 10px;
  }
  .score-grid td {
    font-size: 16px;
  }
  .sheet-footer {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
  }
  .sheet-footer p {
    flex: 1;
  }
  .sheet-signature {
    flex: 0 0 34mm;
    height: 20mm;
    border: 1px solid #111;
    padding: 6px;
    font-size: 10px;
  }
</style>
