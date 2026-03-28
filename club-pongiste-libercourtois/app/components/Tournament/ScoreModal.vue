<script setup lang="ts">
import type { ComponentPublicInstance } from "vue";
import type { BracketMatchWithPlayers } from "~~/server/domains/tournament/types";

const props = defineProps<{
  open: boolean;
  match: BracketMatchWithPlayers | null;
  slug: string;
  seriesId: number;
  setsToWin?: number;
}>();

const emit = defineEmits<{ "update:open": [boolean]; refresh: [] }>();
const toast = useToast();
const saving = ref(false);

const stw = computed(() => props.setsToWin ?? 3);

function playerName(p: BracketMatchWithPlayers["player1"]): string {
  if (!p) return "BYE";
  if (p.partnerLastName) return `${p.lastName} / ${p.partnerLastName}`;
  return `${p.firstName} ${p.lastName}`;
}

// Sets grid — initialize with all sets (best-of-N = setsToWin * 2 - 1 sets)
interface SetRow {
  s1: string;
  s2: string;
}
const totalSets = computed(() => stw.value * 2 - 1);
const sets = ref<SetRow[]>([]);

// Count sets won
const wins1 = computed(
  () =>
    sets.value.filter(
      (s) => s.s1 !== "" && s.s2 !== "" && Number(s.s1) > Number(s.s2),
    ).length,
);
const wins2 = computed(
  () =>
    sets.value.filter(
      (s) => s.s1 !== "" && s.s2 !== "" && Number(s.s2) > Number(s.s1),
    ).length,
);

// Winner only when setsToWin is reached
const winner = computed<1 | 2 | null>(() => {
  if (wins1.value >= stw.value) return 1;
  if (wins2.value >= stw.value) return 2;
  return null;
});

// Refs for each input field to manage focus
const inputRefs = ref<HTMLInputElement[]>([]);

function makeInputRef(rowIndex: number, col: 0 | 1) {
  return (el: Element | ComponentPublicInstance | null) => {
    if (el instanceof HTMLInputElement) {
      inputRefs.value[rowIndex * 2 + col] = el;
    }
  };
}

function focusField(rowIndex: number, col: 0 | 1) {
  nextTick(() => {
    inputRefs.value[rowIndex * 2 + col]?.focus();
    inputRefs.value[rowIndex * 2 + col]?.select();
  });
}

// Called when pressing Enter in s2 of last set
function onLastFieldEnter() {
  if (winner.value) save();
}

// When s1 is confirmed with Enter, jump to s2
function onS1Enter(i: number) {
  focusField(i, 1);
}

// When s2 is confirmed with Enter
function onS2Enter(i: number) {
  if (i < sets.value.length - 1) {
    focusField(i + 1, 0);
  } else {
    onLastFieldEnter();
  }
}

function parsedSets() {
  return sets.value
    .filter((s) => s.s1 !== "" && s.s2 !== "")
    .map((s) => ({ score1: Number(s.s1), score2: Number(s.s2) }));
}

async function save() {
  if (!props.match) return;
  const payload = parsedSets();
  if (payload.length === 0) {
    toast.add({ title: "Saisissez au moins un set", color: "error" });
    return;
  }
  saving.value = true;
  try {
    await $fetch(
      `/api/ja/tournois/${props.slug}/series/${props.seriesId}/matches/${props.match.id}/score`,
      { method: "POST", body: { sets: payload } },
    );
    toast.add({ title: "Score enregistré", color: "success" });
    emit("refresh");
    emit("update:open", false);
  } catch (e: unknown) {
    const msg =
      (e as { data?: { message?: string } })?.data?.message ?? "Erreur";
    toast.add({ title: msg, color: "error" });
  } finally {
    saving.value = false;
  }
}

async function forfeit(winnerId: number) {
  if (!props.match) return;
  saving.value = true;
  try {
    await $fetch(
      `/api/ja/tournois/${props.slug}/series/${props.seriesId}/matches/${props.match.id}/forfeit`,
      { method: "POST", body: { winnerId } },
    );
    toast.add({ title: "Forfait enregistré", color: "success" });
    emit("refresh");
    emit("update:open", false);
  } catch (e: unknown) {
    const msg =
      (e as { data?: { message?: string } })?.data?.message ?? "Erreur";
    toast.add({ title: msg, color: "error" });
  } finally {
    saving.value = false;
  }
}

const isCorrection = computed(
  () => props.match?.status === "finished" || props.match?.status === "forfeit",
);

function reset() {
  if (isCorrection.value && props.match?.sets?.length) {
    // Pre-fill with existing set scores
    const existing = props.match.sets.map((s) => ({
      s1: String(s.score1),
      s2: String(s.score2),
    }));
    const empty = Array.from(
      { length: Math.max(0, totalSets.value - existing.length) },
      () => ({ s1: "", s2: "" }),
    );
    sets.value = [...existing, ...empty];
  } else {
    sets.value = Array.from({ length: totalSets.value }, () => ({
      s1: "",
      s2: "",
    }));
  }
  inputRefs.value = [];
}

watch(
  () => props.open,
  (v) => {
    if (v) {
      reset();
      nextTick(() => focusField(0, 0));
    } else reset();
  },
  { immediate: true },
);
</script>

<template>
  <UModal :open="open" @update:open="$emit('update:open', $event)">
    <template #content>
      <div v-if="match" class="p-6 space-y-5">
        <h3 class="font-semibold text-lg flex items-center gap-2">
          {{ isCorrection ? "Corriger le score" : "Saisir le score" }}
          <span
            v-if="isCorrection"
            class="text-xs font-normal text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-0.5"
          >
            Correction
          </span>
        </h3>

        <!-- Players header -->
        <div
          class="flex items-center justify-between bg-gray-50 rounded px-3 py-2 text-sm font-medium"
        >
          <span>{{ playerName(match.player1) }}</span>
          <span class="text-gray-400 text-xs">vs</span>
          <span>{{ playerName(match.player2) }}</span>
        </div>

        <!-- Score grid -->
        <div class="space-y-2">
          <!-- Column headers -->
          <div class="flex items-center gap-3 text-xs text-gray-400 pl-14">
            <span class="w-16 text-center">{{
              playerName(match.player1).split(" ")[1] ??
              playerName(match.player1)
            }}</span>
            <span class="w-4" />
            <span class="w-16 text-center">{{
              playerName(match.player2).split(" ")[1] ??
              playerName(match.player2)
            }}</span>
          </div>

          <div
            v-for="(set, i) in sets"
            :key="i"
            class="flex items-center gap-3"
          >
            <!-- Set label + wins indicator -->
            <div class="w-14 flex items-center gap-1">
              <span class="text-xs text-gray-500">Set {{ i + 1 }}</span>
            </div>

            <!-- Score 1 -->
            <input
              :ref="makeInputRef(i, 0)"
              v-model="set.s1"
              type="number"
              min="0"
              class="w-16 text-center border border-gray-200 rounded px-2 py-1.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
              :class="
                set.s1 !== '' &&
                set.s2 !== '' &&
                Number(set.s1) > Number(set.s2)
                  ? 'font-bold text-green-700'
                  : ''
              "
              @keydown.enter.prevent="onS1Enter(i)"
            />

            <span class="text-gray-300 w-4 text-center">–</span>

            <!-- Score 2 -->
            <input
              :ref="makeInputRef(i, 1)"
              v-model="set.s2"
              type="number"
              min="0"
              class="w-16 text-center border border-gray-200 rounded px-2 py-1.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
              :class="
                set.s1 !== '' &&
                set.s2 !== '' &&
                Number(set.s2) > Number(set.s1)
                  ? 'font-bold text-green-700'
                  : ''
              "
              @keydown.enter.prevent="onS2Enter(i)"
            />
          </div>

          <!-- Scores tally -->
          <div class="flex items-center gap-3 pl-14 pt-1">
            <div
              class="w-16 text-center text-lg font-bold tabular-nums"
              :class="wins1 > wins2 ? 'text-green-600' : 'text-gray-400'"
            >
              {{ wins1 }}
            </div>
            <div class="w-4 text-center text-xs text-gray-300">–</div>
            <div
              class="w-16 text-center text-lg font-bold tabular-nums"
              :class="wins2 > wins1 ? 'text-green-600' : 'text-gray-400'"
            >
              {{ wins2 }}
            </div>
          </div>
        </div>

        <!-- Winner banner (only when setsToWin reached) -->
        <div
          v-if="winner"
          class="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2"
        >
          <UIcon
            name="i-heroicons-trophy"
            class="w-4 h-4 text-green-500 shrink-0"
          />
          Vainqueur :
          <strong>{{
            winner === 1 ? playerName(match.player1) : playerName(match.player2)
          }}</strong>
          <span class="ml-auto text-xs text-green-500"
            >↵ Entrée pour enregistrer</span
          >
        </div>

        <!-- Actions -->
        <div class="flex justify-between items-center pt-2 border-t">
          <div class="flex gap-2">
            <!-- Forfait X → l'adversaire gagne, donc winnerId = opponent -->
            <UButton
              v-if="match.player1 && match.player2"
              size="xs"
              variant="ghost"
              color="error"
              :loading="saving"
              @click="forfeit(match.player2!.id)"
            >
              Forfait {{ playerName(match.player1) }}
            </UButton>
            <UButton
              v-if="match.player1 && match.player2"
              size="xs"
              variant="ghost"
              color="error"
              :loading="saving"
              @click="forfeit(match.player1!.id)"
            >
              Forfait {{ playerName(match.player2) }}
            </UButton>
          </div>
          <div class="flex gap-2">
            <UButton
              variant="ghost"
              color="neutral"
              @click="$emit('update:open', false)"
            >
              Annuler
            </UButton>
            <UButton :loading="saving" :disabled="!winner" @click="save">
              Enregistrer
            </UButton>
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>
