<script setup lang="ts">
import type { BracketRound } from "~~/server/domains/tournament/types";

const props = defineProps<{
  rounds: BracketRound[];
  seriesId: number;
  slug: string;
  swapApiBase?: string; // defaults to /api/admin — pass /api/ja for JA interface
}>();

const emit = defineEmits<{ refresh: [] }>();
const toast = useToast();

const connectorStroke = useBracketConnectorStroke();

const swapping = ref(false);
const selected = ref<number | null>(null); // registration id en attente d'échange

function selectForSwap(registrationId: number | null) {
  if (!registrationId) return;
  if (selected.value === null) {
    selected.value = registrationId;
    return;
  }
  if (selected.value === registrationId) {
    selected.value = null;
    return;
  }
  doSwap(selected.value, registrationId);
}

async function doSwap(id1: number, id2: number) {
  swapping.value = true;
  try {
    const base = props.swapApiBase ?? "/api/admin";
    await $fetch(
      `${base}/tournois/${props.slug}/series/${props.seriesId}/bracket/swap`,
      {
        method: "POST",
        body: { registrationId1: id1, registrationId2: id2 },
      },
    );
    selected.value = null;
    emit("refresh");
    toast.add({ title: "Joueurs échangés", color: "success" });
  } catch (_e: unknown) {
    toast.add({ title: "Erreur lors de l'échange", color: "error" });
  } finally {
    swapping.value = false;
  }
}

const MATCH_H = 58;
const GAP = 12;

function slotHeight(ri: number): number {
  const p = Math.pow(2, ri);
  return MATCH_H * p + GAP * (p - 1);
}

function columnHeight(ri: number): number {
  const n = props.rounds[ri]!.matches.length;
  const sh = slotHeight(ri);
  return n > 0 ? n * sh + (n - 1) * GAP : 0;
}

function connectorPaths(leftRi: number): { d: string }[] {
  const matches = props.rounds[leftRi]!.matches;
  const sh = slotHeight(leftRi);
  const paths: { d: string }[] = [];
  for (let k = 0; k < matches.length; k += 2) {
    const yTop = k * (sh + GAP) + sh / 2;
    const yBot = (k + 1) * (sh + GAP) + sh / 2;
    const yMid = (yTop + yBot) / 2;
    const xM = 14;
    paths.push({
      d: `M -1 ${yTop} H ${xM} V ${yBot} H -1 M ${xM} ${yMid} H 29`,
    });
  }
  return paths;
}
</script>

<template>
  <div>
    <div
      v-if="selected !== null"
      class="mb-3 px-3 py-2 bg-primary-50 border border-primary-200 rounded text-sm text-primary-800"
    >
      <UIcon name="i-heroicons-arrows-right-left" class="mr-1" />
      Sélectionnez un second joueur pour effectuer l'échange. Cliquez à nouveau
      sur le même pour annuler.
    </div>

    <div v-if="rounds.length === 0" class="text-center text-gray-400 py-8">
      Tableau non généré
    </div>
    <div v-else class="overflow-x-auto overflow-y-visible">
      <div class="inline-flex flex-col p-4">
        <!-- Labels row -->
        <div class="flex flex-row mb-3">
          <template v-for="(round, ri) in rounds" :key="`lbl-${ri}`">
            <div v-if="ri > 0" :style="{ width: '28px' }" />
            <div
              class="w-44 text-xs font-medium text-gray-500 uppercase tracking-wide text-center"
            >
              {{ round.label }}
            </div>
          </template>
        </div>

        <!-- Match slots + connectors row -->
        <div class="flex flex-row items-start">
          <template v-for="(round, ri) in rounds" :key="`col-${ri}`">
            <!-- SVG connector -->
            <svg
              v-if="ri > 0"
              width="28"
              :height="columnHeight(ri - 1)"
              class="shrink-0 overflow-visible"
            >
              <path
                v-for="(p, pi) in connectorPaths(ri - 1)"
                :key="pi"
                :d="p.d"
                fill="none"
                :stroke="connectorStroke"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>

            <!-- Round column -->
            <div class="flex flex-col gap-3 shrink-0">
              <div
                v-for="match in round.matches"
                :key="match.id"
                class="flex items-center"
                :style="{ height: `${slotHeight(ri)}px` }"
              >
                <!-- First round: editable swap cards -->
                <div
                  v-if="ri === 0"
                  class="w-44 border rounded overflow-hidden text-sm bg-white dark:bg-gray-800 shadow-xs"
                  :class="
                    selected !== null
                      ? 'border-primary-300'
                      : 'border-gray-200 dark:border-gray-700'
                  "
                >
                  <div
                    v-for="(player, pi) in [match.player1, match.player2]"
                    :key="pi"
                    class="flex items-center justify-between px-2 py-1 cursor-pointer transition-colors"
                    :class="[
                      pi === 0
                        ? 'border-b border-gray-100 dark:border-gray-700'
                        : '',
                      !player ? 'opacity-40 cursor-default' : '',
                    ]"
                    :style="
                      player && selected === player.id
                        ? {}
                        : {
                            backgroundColor:
                              clubBgColor(player?.club) || undefined,
                          }
                    "
                    :data-selected="player && selected === player.id"
                    @click="player && selectForSwap(player.id)"
                  >
                    <span
                      class="truncate text-xs"
                      :class="[
                        !player ? 'text-gray-400 italic' : 'text-black',
                        player && selected === player.id ? 'font-semibold' : '',
                      ]"
                    >
                      {{ player ? playerDisplayName(player) : "—" }}
                    </span>
                    <UIcon
                      v-if="player && selected === player.id"
                      name="i-heroicons-check-circle"
                      class="w-3 h-3 text-primary-600 shrink-0 ml-1"
                    />
                    <UIcon
                      v-else-if="player"
                      name="i-heroicons-arrows-up-down"
                      class="w-3 h-3 text-gray-400 shrink-0 ml-1"
                    />
                  </div>
                </div>
                <!-- Other rounds: read-only -->
                <TournamentBracketMatch v-else :match="match" />
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
