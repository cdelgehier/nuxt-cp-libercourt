<script setup lang="ts">
import {
  createTournamentInputSchema,
  type EnrichedTournament,
} from "~~/server/domains/tournament/types";

definePageMeta({ layout: "admin", middleware: "admin" });
useSeoMeta({ title: "Admin — Tournois", robots: "noindex,nofollow" });

const toast = useToast();
const {
  data: tournaments,
  pending,
  refresh,
} = await useFetch<EnrichedTournament[]>("/api/admin/tournois");

const modalOpen = ref(false);
const saving = ref(false);

const DEFAULT_FORM = {
  name: "",
  date: "",
  dateEnd: "",
  location: "Complexe Sportif Léo Lagrange, Libercourt",
  locationLat: 50.48185408012125,
  locationLng: 3.017099247377654,
  description: "",
  tableCount: 1,
  isPublished: false,
} as const;

const form = reactive({ ...DEFAULT_FORM });

const errors = reactive<Record<string, string>>({});

const schema = createTournamentInputSchema;

function resetForm() {
  Object.assign(form, DEFAULT_FORM);
  Object.keys(errors).forEach((k) => Reflect.deleteProperty(errors, k));
}

async function create() {
  const result = schema.safeParse(form);
  if (!result.success) {
    result.error.issues.forEach((i) => {
      errors[String(i.path[0])] = i.message;
    });
    return;
  }
  Object.keys(errors).forEach((k) => Reflect.deleteProperty(errors, k));
  saving.value = true;
  try {
    await $fetch("/api/admin/tournois", { method: "POST", body: form });
    toast.add({ title: "Tournoi créé", color: "success" });
    await refresh();
    modalOpen.value = false;
    resetForm();
  } catch (e: unknown) {
    const msg =
      (e as { data?: { message?: string } })?.data?.message ?? "Erreur";
    toast.add({ title: msg, color: "error" });
  } finally {
    saving.value = false;
  }
}

function formatDate(t: EnrichedTournament) {
  return formatDateRange(t.date, t.dateEnd);
}

async function deleteTournament(t: EnrichedTournament) {
  if (
    !confirm(`Supprimer "${t.name}" et toutes ses séries/inscriptions/matchs ?`)
  )
    return;
  try {
    await $fetch(`/api/admin/tournois/${t.slug}`, { method: "DELETE" });
    toast.add({ title: "Tournoi supprimé", color: "success" });
    await refresh();
  } catch (e: unknown) {
    const msg =
      (e as { data?: { message?: string } })?.data?.message ?? "Erreur";
    toast.add({ title: msg, color: "error" });
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">Tournois</h1>
      <UButton icon="i-heroicons-plus" @click="modalOpen = true">
        Nouveau tournoi
      </UButton>
    </div>

    <div v-if="pending" class="text-center text-gray-400 py-6">
      Chargement...
    </div>
    <div
      v-else-if="!tournaments || tournaments.length === 0"
      class="text-center text-gray-400 py-6"
    >
      Aucun tournoi
    </div>
    <table v-else class="w-full text-sm">
      <thead class="bg-gray-50 text-gray-500 uppercase text-xs">
        <tr>
          <th class="px-4 py-2 text-left">Nom</th>
          <th class="px-4 py-2 text-left">Date</th>
          <th class="px-4 py-2 text-left">Séries</th>
          <th class="px-4 py-2 text-left">Statut</th>
          <th class="px-4 py-2" />
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100">
        <tr v-for="t in tournaments" :key="t.id" class="hover:bg-gray-50">
          <td class="px-4 py-2 font-medium">{{ t.name }}</td>
          <td class="px-4 py-2">{{ formatDate(t) }}</td>
          <td class="px-4 py-2">{{ t.seriesCount }}</td>
          <td class="px-4 py-2">
            <UBadge
              :color="t.isPublished ? 'success' : 'neutral'"
              variant="subtle"
              size="sm"
            >
              {{ t.isPublished ? "Publié" : "Brouillon" }}
            </UBadge>
          </td>
          <td class="px-4 py-2 flex gap-1 justify-end">
            <NuxtLink :to="`/admin/tournois/${t.slug}`">
              <UButton
                size="xs"
                variant="ghost"
                color="neutral"
                icon="i-heroicons-pencil"
              />
            </NuxtLink>
            <UButton
              size="xs"
              variant="ghost"
              color="error"
              icon="i-heroicons-trash"
              @click="deleteTournament(t)"
            />
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Create modal -->
    <UModal v-model:open="modalOpen">
      <template #content>
        <div class="p-6 space-y-4">
          <h3 class="font-semibold text-lg">Nouveau tournoi</h3>

          <UFormField label="Nom" :error="errors.name" required>
            <UInput v-model="form.name" placeholder="Open Libercourtois 2025" />
          </UFormField>
          <UFormField label="Date de début" :error="errors.date" required>
            <UInput v-model="form.date" type="date" />
          </UFormField>
          <UFormField
            label="Date de fin (tournoi multi-jours)"
            :error="errors.dateEnd"
          >
            <UInput v-model="form.dateEnd" type="date" :min="form.date" />
          </UFormField>
          <UFormField label="Lieu">
            <UInput v-model="form.location" placeholder="Salle des fêtes" />
          </UFormField>
          <UFormField label="Nombre de tables" :error="errors.tableCount">
            <UInput
              v-model.number="form.tableCount"
              type="number"
              min="1"
              max="100"
            />
          </UFormField>
          <UFormField label="Description">
            <UTextarea v-model="form.description" :rows="3" />
          </UFormField>
          <UFormField label="Publier immédiatement">
            <USwitch v-model="form.isPublished" />
          </UFormField>

          <div class="flex justify-end gap-2 pt-2">
            <UButton
              variant="ghost"
              color="neutral"
              @click="
                modalOpen = false;
                resetForm();
              "
              >Annuler</UButton
            >
            <UButton :loading="saving" @click="create">Créer</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
