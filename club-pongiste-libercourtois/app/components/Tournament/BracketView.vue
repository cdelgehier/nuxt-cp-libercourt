<script setup lang="ts">
import type {
  BracketRound,
  BracketMatchWithPlayers,
} from "~~/server/domains/tournament/types";
import {
  buildLicenseeFromRegistration,
  licenseeDetailsSchema,
  type LicenseeModalData,
} from "~/utils/bracketPlayer";

const props = defineProps<{
  rounds: BracketRound[];
  highlight?: Set<number> | null;
}>();

type Registration = NonNullable<BracketMatchWithPlayers["player1"]>;

const licensee = ref<LicenseeModalData | null>(null);
const modalOpen = ref(false);

async function openPlayer(reg: Registration) {
  if (!reg.licenceNumber) return;

  try {
    const result = await $fetch<{ success: boolean; licensee: unknown }>(
      `/api/club/licensee/${reg.licenceNumber}`,
    );
    const parsed =
      result?.success && result.licensee
        ? licenseeDetailsSchema.safeParse(result.licensee)
        : null;
    licensee.value = buildLicenseeFromRegistration(
      reg,
      parsed?.success ? parsed.data : null,
    );
  } catch (_e) {
    licensee.value = buildLicenseeFromRegistration(reg);
  }

  modalOpen.value = true;
}

const connectorStroke = useBracketConnectorStroke();

const MATCH_H = 58; // card height in px (2 rows × 28px + 2px border)
const GAP = 12; // gap between slots (gap-3)
const CONN_W = 28; // connector SVG width in px

// Slot height for round index i: MATCH_H × 2^i + GAP × (2^i − 1)
function slotHeight(ri: number): number {
  const p = Math.pow(2, ri);
  return MATCH_H * p + GAP * (p - 1);
}

// Total pixel height of a round column (slots only, no label)
function columnHeight(ri: number): number {
  const n = props.rounds[ri]!.matches.length;
  const sh = slotHeight(ri);
  return n > 0 ? n * sh + (n - 1) * GAP : 0;
}

// SVG paths connecting pairs in round `leftRi` to round `leftRi + 1`
interface ConnPath {
  d: string;
}
function connectorPaths(leftRi: number): ConnPath[] {
  const matches = props.rounds[leftRi]!.matches;
  const sh = slotHeight(leftRi);
  const paths: ConnPath[] = [];
  for (let k = 0; k < matches.length; k += 2) {
    const yTop = k * (sh + GAP) + sh / 2;
    const yBot = (k + 1) * (sh + GAP) + sh / 2;
    const yMid = (yTop + yBot) / 2;
    const xM = CONN_W / 2;
    // Horizontal lines start at -1 and end at CONN_W+1 so they
    // visually overlap the card borders (SVG overflow-visible handles this)
    paths.push({
      d: `M -1 ${yTop} H ${xM} V ${yBot} H -1 M ${xM} ${yMid} H ${CONN_W + 1}`,
    });
  }
  return paths;
}
</script>

<template>
  <div v-if="rounds.length === 0" class="text-center text-gray-400 py-8">
    Tableau non généré
  </div>
  <div v-else class="overflow-x-auto overflow-y-visible">
    <div class="inline-flex flex-col p-4">
      <!-- Labels row -->
      <div class="flex flex-row mb-3">
        <template v-for="(round, ri) in rounds" :key="`lbl-${ri}`">
          <div v-if="ri > 0" :style="{ width: `${CONN_W}px` }" />
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
          <!-- SVG connector from previous round -->
          <svg
            v-if="ri > 0"
            :width="CONN_W"
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
              <TournamentBracketMatch
                :match="match"
                :highlight="highlight"
                @click-player="openPlayer"
              />
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>

  <LicenseeDetailModal v-model="modalOpen" :licensee="licensee" />
</template>
