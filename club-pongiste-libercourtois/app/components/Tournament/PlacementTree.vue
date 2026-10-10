<script setup lang="ts">
  import type {
    IntegralState,
    IntegralMatch
  } from '~~/server/domains/tournament/integral'
  const props = defineProps<{
    state: IntegralState
    registrations: {
      id: number
      firstName: string
      lastName: string
      partnerFirstName: string | null
      partnerLastName: string | null
    }[]
    editable: boolean
  }>()
  const emit = defineEmits<{ open: [match: IntegralMatch] }>()
  function name(id: number | null): string {
    const player = props.registrations.find(function (entry) {
      return entry.id === id
    })
    if (!player) return 'À déterminer'
    return `${player.firstName} ${player.lastName}${player.partnerLastName ? ` / ${player.partnerFirstName ?? ''} ${player.partnerLastName}` : ''}`
  }
  const levels = computed(function () {
    const groups = new Map<number, typeof props.state.nodes>()
    for (const node of props.state.nodes) {
      const size = node.end - node.start + 1
      const level = Math.ceil(Math.log2(size))
      if (!groups.has(level)) groups.set(level, [])
      groups.get(level)!.push(node)
    }
    return [...groups.entries()]
      .sort(function (a, b) {
        return b[0] - a[0]
      })
      .map(function ([level, nodes]) {
        return {
          level,
          nodes: nodes.sort(function (a, b) {
            return a.start - b.start
          })
        }
      })
  })
  function matches(start: number, end: number): IntegralMatch[] {
    return props.state.matches.filter(function (match) {
      return match.rangeStart === start && match.rangeEnd === end
    })
  }
  function place(start: number): string {
    const entry = Object.entries(props.state.placements).find(function ([
      ,
      value
    ]) {
      return value === start
    })
    return entry ? name(Number(entry[0])) : 'À déterminer'
  }
  function route(match: IntegralMatch, outcome: 'winner' | 'loser'): string {
    const node = props.state.nodes.find(function (entry) {
      return entry.sources.some(function (source) {
        return source.match === match.id && source.outcome === outcome
      })
    })
    return node
      ? node.start === node.end
        ? `Place ${node.start}`
        : `${node.start}–${node.end}`
      : 'À déterminer'
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
</script>
<template>
  <div>
    <p class="mb-4 text-sm text-gray-500">
      Chaque gagnant poursuit vers les meilleures places ; chaque perdant
      rejoint sa branche de classement.
    </p>
    <p v-if="!state.nodes.length" class="py-8 text-gray-500">
      Les arbres s’ouvrent après validation des barrages.
    </p>
    <div class="overflow-x-auto pb-4">
      <div class="flex min-w-max items-start gap-8">
        <div v-for="level in levels" :key="level.level" class="w-80 space-y-6">
          <article
            v-for="node in level.nodes"
            :key="`${node.start}:${node.end}`"
            class="rounded-xl border border-gray-300 bg-white p-3 dark:bg-gray-900"
          >
            <h3 class="mb-3 border-b pb-2 font-bold text-primary">
              {{ node.start === node.end ? 'Place' : 'Places' }} {{ node.start
              }}{{ node.end === node.start ? '' : `–${node.end}` }}
            </h3>
            <p v-if="node.start === node.end" class="font-semibold">
              {{ place(node.start) }}
            </p>
            <p v-else-if="!node.generated" class="text-sm text-gray-400">
              En attente des résultats de la branche précédente.
            </p>
            <div
              v-for="match in matches(node.start, node.end)"
              :key="match.id"
              class="mb-3 rounded-lg border p-2 text-sm"
            >
              <p
                :class="{
                  'font-bold text-green-700 dark:text-green-300':
                    match.winner === match.player1
                }"
              >
                {{ name(match.player1) }}
              </p>
              <p
                class="my-1 border-t pt-1"
                :class="{
                  'font-bold text-green-700 dark:text-green-300':
                    match.winner === match.player2
                }"
              >
                {{ name(match.player2) }}
              </p>
              <p class="mt-2 font-semibold">{{ score(match) }}</p>
              <p v-if="match.table" class="mt-1 text-xs text-gray-500">
                Table {{ match.table }} ·
                {{ match.status === 'in_progress' ? 'En cours' : '' }}
              </p>
              <div class="mt-2 flex justify-between border-t pt-2 text-xs">
                <span class="text-green-700 dark:text-green-300"
                  >Gagnant → {{ route(match, 'winner') }}</span
                ><span class="text-amber-700 dark:text-amber-300"
                  >Perdant → {{ route(match, 'loser') }}</span
                >
              </div>
              <UButton
                v-if="editable && match.status !== 'forfeit'"
                size="xs"
                class="mt-2"
                variant="outline"
                @click="emit('open', match)"
                >{{
                  match.status === 'finished'
                    ? 'Corriger'
                    : match.status === 'in_progress'
                      ? 'Saisir'
                      : 'Lancer'
                }}</UButton
              >
            </div>
          </article>
        </div>
      </div>
    </div>
  </div>
</template>
