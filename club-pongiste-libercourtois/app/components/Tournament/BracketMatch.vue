<script setup lang="ts">
import type { BracketMatchWithPlayers } from "~~/server/domains/tournament/types";

const props = defineProps<{
  match: BracketMatchWithPlayers;
  highlight?: Set<number> | null;
}>();

const emit = defineEmits<{
  "click-player": [reg: NonNullable<BracketMatchWithPlayers["player1"]>];
}>();

function onPlayerClick(e: MouseEvent, reg: BracketMatchWithPlayers["player1"]) {
  if (!reg?.licenceNumber) return;
  e.stopPropagation();
  emit("click-player", reg);
}

// playerDisplayName is auto-imported from app/utils/bracketPlayer.ts

function playerTitle(reg: BracketMatchWithPlayers["player1"]): string {
  if (!reg) return "";
  if (reg.partnerLastName) {
    const p1 = `${reg.firstName} ${reg.lastName}${reg.club ? ` — ${reg.club}` : ""}`;
    const p2 =
      `${reg.partnerFirstName ?? ""} ${reg.partnerLastName}${reg.partnerClub ? ` — ${reg.partnerClub}` : ""}`.trim();
    return `${p1} / ${p2}`;
  }
  return `${reg.firstName} ${reg.lastName}${reg.club ? ` — ${reg.club}` : ""}`;
}

function playerScore(playerSlot: 1 | 2): number {
  return props.match.sets.filter((s) =>
    playerSlot === 1 ? s.score1 > s.score2 : s.score2 > s.score1,
  ).length;
}

const isFinished = computed(
  () => props.match.status === "finished" || props.match.status === "forfeit",
);
const isForfeit = computed(() => props.match.status === "forfeit");
const hasSets = computed(() => props.match.sets.length > 0);

// Dimmed when a club filter is active and neither player belongs to it
const isDimmed = computed(() => {
  if (!props.highlight) return false;
  const h = props.highlight;
  return (
    !h.has(props.match.player1?.id ?? -1) &&
    !h.has(props.match.player2?.id ?? -1)
  );
});

const showSets = ref(false);

function toggleSets() {
  if (isFinished.value && hasSets.value) showSets.value = !showSets.value;
}

function isWinner(reg: BracketMatchWithPlayers["player1"]): boolean {
  return !!reg && reg.id === props.match.winnerId;
}

function isForfeiter(reg: BracketMatchWithPlayers["player1"]): boolean {
  return isForfeit.value && !!reg && !isWinner(reg);
}

function rowClass(reg: BracketMatchWithPlayers["player1"]): string {
  const classes: string[] = [];
  if (isFinished.value && isWinner(reg)) classes.push("font-semibold");
  if (isFinished.value && !isWinner(reg) && reg)
    classes.push("opacity-40 dark:opacity-60");
  if (isForfeiter(reg)) classes.push("line-through decoration-red-400");
  return classes.join(" ");
}
</script>

<template>
  <div
    class="relative w-44 transition-opacity"
    :class="isDimmed ? 'opacity-25' : ''"
  >
    <div
      class="bracket-match border rounded overflow-hidden text-sm bg-white dark:bg-gray-800 shadow-xs"
      :class="[
        isForfeit
          ? 'border-red-200 dark:border-red-800'
          : 'border-gray-200 dark:border-gray-700',
        isFinished && hasSets ? 'cursor-pointer select-none' : '',
      ]"
      @click="toggleSets"
    >
      <!-- Player 1 -->
      <div
        class="flex items-center justify-between px-2 py-1 border-b border-gray-100 dark:border-gray-700"
        :class="rowClass(match.player1)"
        :style="
          match.player1?.club
            ? { backgroundColor: clubBgColor(match.player1.club) }
            : {}
        "
      >
        <span
          v-if="match.player1"
          class="truncate min-w-0 text-black"
          :class="
            match.player1.licenceNumber ? 'cursor-pointer hover:underline' : ''
          "
          :title="playerTitle(match.player1)"
          @click="onPlayerClick($event, match.player1)"
        >
          {{ playerDisplayName(match.player1) }}
        </span>
        <span v-else class="text-gray-400 dark:text-gray-500 italic text-xs"
          >—</span
        >
        <span
          v-if="isForfeiter(match.player1)"
          class="ml-2 text-xs text-red-400 font-medium shrink-0"
          >FF</span
        >
        <span
          v-else-if="isFinished && !showSets"
          class="ml-2 tabular-nums font-mono text-xs shrink-0 text-black"
          >{{ playerScore(1) }}</span
        >
      </div>
      <!-- Player 2 -->
      <div
        class="flex items-center justify-between px-2 py-1"
        :class="rowClass(match.player2)"
        :style="
          match.player2?.club
            ? { backgroundColor: clubBgColor(match.player2.club) }
            : {}
        "
      >
        <span
          v-if="match.player2"
          class="truncate min-w-0 text-black"
          :class="
            match.player2.licenceNumber ? 'cursor-pointer hover:underline' : ''
          "
          :title="playerTitle(match.player2)"
          @click="onPlayerClick($event, match.player2)"
        >
          {{ playerDisplayName(match.player2) }}
        </span>
        <span v-else class="text-gray-400 dark:text-gray-500 italic text-xs"
          >—</span
        >
        <span
          v-if="isForfeiter(match.player2)"
          class="ml-2 text-xs text-red-400 font-medium shrink-0"
          >FF</span
        >
        <span
          v-else-if="isFinished && !showSets"
          class="ml-2 tabular-nums font-mono text-xs shrink-0 text-black"
          >{{ playerScore(2) }}</span
        >
      </div>
    </div>
    <!-- Set scores: absolute so card height stays fixed (bracket connectors unaffected) -->
    <div
      v-if="showSets"
      class="absolute left-0 right-0 top-full z-10 flex flex-wrap gap-x-2 gap-y-0.5 px-2 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 border-t-0 rounded-b shadow-sm"
    >
      <span
        v-for="(set, i) in match.sets"
        :key="i"
        class="tabular-nums font-mono text-xs"
        :class="set.score1 > set.score2 ? 'font-semibold' : 'opacity-50'"
      >
        {{ set.score1 }}-{{ set.score2 }}
      </span>
    </div>
  </div>
</template>
