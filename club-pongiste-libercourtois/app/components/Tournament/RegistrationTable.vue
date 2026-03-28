<script setup lang="ts">
import type {
  SeriesRegistration,
  SeriesFormat,
} from "~~/server/domains/tournament/types";

const props = defineProps<{
  registrations: SeriesRegistration[];
  seriesFormat: SeriesFormat;
  slug: string;
  seriesId: number;
  loading?: boolean;
  apiBase?: string;
}>();

const base = computed(() => props.apiBase ?? `/api/admin/tournois`);
const emit = defineEmits<{ refresh: [] }>();
const toast = useToast();

// Sort state
type SortKey = "name" | "club" | "pts" | "presence" | "payment";
const sortKey = ref<SortKey | null>(null);
const sortDir = ref<"asc" | "desc">("asc");

function toggleSort(key: SortKey) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === "asc" ? "desc" : "asc";
  } else {
    sortKey.value = key;
    sortDir.value = "asc";
  }
}

const PRESENCE_ORDER: Record<string, number> = {
  present: 0,
  unknown: 1,
  absent: 2,
};
const PAYMENT_ORDER: Record<string, number> = {
  paid: 0,
  unpaid: 1,
  refunded: 2,
};

const sorted = computed(() => {
  const list = [...props.registrations];
  if (!sortKey.value) return list;
  const key = sortKey.value;
  return list.sort((a, b) => {
    let va: string | number;
    let vb: string | number;
    if (key === "name") {
      va = `${a.lastName} ${a.firstName}`.toLowerCase();
      vb = `${b.lastName} ${b.firstName}`.toLowerCase();
    } else if (key === "club") {
      va = (a.club ?? "").toLowerCase();
      vb = (b.club ?? "").toLowerCase();
    } else if (key === "pts") {
      va = a.ranking ?? 0;
      vb = b.ranking ?? 0;
    } else if (key === "presence") {
      va = PRESENCE_ORDER[a.attendanceStatus ?? "unknown"] ?? 1;
      vb = PRESENCE_ORDER[b.attendanceStatus ?? "unknown"] ?? 1;
    } else {
      va = PAYMENT_ORDER[a.paymentStatus ?? "unpaid"] ?? 1;
      vb = PAYMENT_ORDER[b.paymentStatus ?? "unpaid"] ?? 1;
    }
    const cmp = va < vb ? -1 : va > vb ? 1 : 0;
    return sortDir.value === "asc" ? cmp : -cmp;
  });
});

async function patch(regId: number, body: Partial<SeriesRegistration>) {
  try {
    await $fetch(
      `${base.value}/${props.slug}/series/${props.seriesId}/registrations/${regId}`,
      { method: "PATCH", body },
    );
    emit("refresh");
  } catch {
    toast.add({ title: "Erreur de mise à jour", color: "error" });
  }
}

async function remove(regId: number) {
  try {
    await $fetch(
      `${base.value}/${props.slug}/series/${props.seriesId}/registrations/${regId}`,
      { method: "DELETE" },
    );
    emit("refresh");
    toast.add({ title: "Inscription supprimée", color: "success" });
  } catch {
    toast.add({ title: "Erreur de suppression", color: "error" });
  }
}

function playerName(r: SeriesRegistration): string {
  let name = `${r.firstName} ${r.lastName}`;
  if (props.seriesFormat === "doubles" && r.partnerFirstName) {
    name += ` / ${r.partnerFirstName} ${r.partnerLastName}`;
  }
  return name;
}

function pointsDisplay(r: SeriesRegistration): string {
  if (props.seriesFormat !== "doubles")
    return r.ranking != null ? String(r.ranking) : "—";
  if (r.ranking == null && r.partnerRanking == null) return "—";
  return String((r.ranking ?? 0) + (r.partnerRanking ?? 0));
}

function clubDisplay(r: SeriesRegistration): string {
  if (props.seriesFormat !== "doubles") return r.club ?? "—";
  if (!r.partnerClub || r.club === r.partnerClub) return r.club ?? "—";
  return `${r.club ?? "?"} / ${r.partnerClub}`;
}

function cycleAttendance(r: SeriesRegistration) {
  const next =
    r.attendanceStatus === "unknown"
      ? "present"
      : r.attendanceStatus === "present"
        ? "absent"
        : "unknown";
  patch(r.id, { attendanceStatus: next });
}
</script>

<template>
  <div>
    <div v-if="loading" class="text-center text-gray-400 py-4">
      Chargement...
    </div>
    <div
      v-else-if="registrations.length === 0"
      class="text-center text-gray-400 py-6"
    >
      Aucun joueur inscrit
    </div>
    <div v-else class="overflow-x-auto rounded-lg border border-gray-200">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="px-3 py-2.5 text-left">
              <button
                class="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-800 transition-colors"
                @click="toggleSort('name')"
              >
                Joueur
                <UIcon
                  v-if="sortKey === 'name'"
                  :name="
                    sortDir === 'asc'
                      ? 'i-heroicons-chevron-up'
                      : 'i-heroicons-chevron-down'
                  "
                  class="w-3 h-3"
                />
                <UIcon
                  v-else
                  name="i-heroicons-chevron-up-down"
                  class="w-3 h-3 text-gray-300"
                />
              </button>
            </th>
            <th class="px-3 py-2.5 text-left">
              <button
                class="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-800 transition-colors"
                @click="toggleSort('club')"
              >
                Club
                <UIcon
                  v-if="sortKey === 'club'"
                  :name="
                    sortDir === 'asc'
                      ? 'i-heroicons-chevron-up'
                      : 'i-heroicons-chevron-down'
                  "
                  class="w-3 h-3"
                />
                <UIcon
                  v-else
                  name="i-heroicons-chevron-up-down"
                  class="w-3 h-3 text-gray-300"
                />
              </button>
            </th>
            <th class="px-3 py-2.5 text-left">
              <button
                class="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-800 transition-colors"
                @click="toggleSort('pts')"
              >
                Pts
                <UIcon
                  v-if="sortKey === 'pts'"
                  :name="
                    sortDir === 'asc'
                      ? 'i-heroicons-chevron-up'
                      : 'i-heroicons-chevron-down'
                  "
                  class="w-3 h-3"
                />
                <UIcon
                  v-else
                  name="i-heroicons-chevron-up-down"
                  class="w-3 h-3 text-gray-300"
                />
              </button>
            </th>
            <th class="px-3 py-2.5 text-center">
              <button
                class="flex items-center gap-1 mx-auto text-xs font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-800 transition-colors"
                @click="toggleSort('presence')"
              >
                Présence
                <UIcon
                  v-if="sortKey === 'presence'"
                  :name="
                    sortDir === 'asc'
                      ? 'i-heroicons-chevron-up'
                      : 'i-heroicons-chevron-down'
                  "
                  class="w-3 h-3"
                />
                <UIcon
                  v-else
                  name="i-heroicons-chevron-up-down"
                  class="w-3 h-3 text-gray-300"
                />
              </button>
            </th>
            <th class="px-3 py-2.5 text-center">
              <button
                class="flex items-center gap-1 mx-auto text-xs font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-800 transition-colors"
                @click="toggleSort('payment')"
              >
                Payé
                <UIcon
                  v-if="sortKey === 'payment'"
                  :name="
                    sortDir === 'asc'
                      ? 'i-heroicons-chevron-up'
                      : 'i-heroicons-chevron-down'
                  "
                  class="w-3 h-3"
                />
                <UIcon
                  v-else
                  name="i-heroicons-chevron-up-down"
                  class="w-3 h-3 text-gray-300"
                />
              </button>
            </th>
            <th
              class="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide"
            >
              Forfait
            </th>
            <th class="px-3 py-2.5 w-8" />
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr
            v-for="r in sorted"
            :key="r.id"
            class="hover:bg-gray-50 transition-colors"
            :class="r.isForfeit ? 'opacity-50' : ''"
          >
            <!-- Joueur -->
            <td class="px-3 py-2.5 font-medium text-gray-900">
              {{ playerName(r) }}
            </td>
            <!-- Club -->
            <td class="px-3 py-2.5 text-gray-500 text-xs">
              {{ clubDisplay(r) }}
            </td>
            <!-- Pts -->
            <td
              class="px-3 py-2.5 tabular-nums text-gray-600 font-mono text-xs"
            >
              {{ pointsDisplay(r) }}
            </td>
            <!-- Présence — cycle unknown → present → absent → unknown -->
            <td class="px-3 py-2.5 text-center">
              <UButton
                size="xs"
                variant="ghost"
                :color="
                  r.attendanceStatus === 'present'
                    ? 'success'
                    : r.attendanceStatus === 'absent'
                      ? 'error'
                      : 'neutral'
                "
                :icon="
                  r.attendanceStatus === 'present'
                    ? 'i-heroicons-check-circle'
                    : r.attendanceStatus === 'absent'
                      ? 'i-heroicons-x-circle'
                      : 'i-heroicons-minus-circle'
                "
                :title="
                  r.attendanceStatus === 'present'
                    ? 'Présent → cliquer : absent'
                    : r.attendanceStatus === 'absent'
                      ? 'Absent → cliquer : reset'
                      : 'Inconnu → cliquer : présent'
                "
                @click="cycleAttendance(r)"
              />
            </td>
            <!-- Payé -->
            <td class="px-3 py-2.5 text-center">
              <UButton
                size="xs"
                variant="ghost"
                :color="r.paymentStatus === 'paid' ? 'success' : 'neutral'"
                icon="i-heroicons-currency-euro"
                :title="
                  r.paymentStatus === 'paid'
                    ? 'Payé → cliquer : annuler'
                    : 'Non payé → cliquer : marquer payé'
                "
                @click="
                  patch(r.id, {
                    paymentStatus:
                      r.paymentStatus === 'paid' ? 'unpaid' : 'paid',
                  })
                "
              />
            </td>
            <!-- Forfait -->
            <td class="px-3 py-2.5 text-center">
              <USwitch
                :model-value="r.isForfeit"
                size="xs"
                @update:model-value="patch(r.id, { isForfeit: $event })"
              />
            </td>
            <!-- Supprimer -->
            <td class="px-3 py-2.5">
              <UButton
                size="xs"
                variant="ghost"
                color="error"
                icon="i-heroicons-trash"
                title="Supprimer"
                @click="remove(r.id)"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
