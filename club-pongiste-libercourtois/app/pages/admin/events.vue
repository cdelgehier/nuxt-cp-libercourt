<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <p class="text-sm text-gray-500 dark:text-gray-400">
        {{ events?.data?.length ?? 0 }} événement(s)
      </p>
      <UButton icon="i-heroicons-plus" @click="openCreate">
        Nouvel événement
      </UButton>
    </div>

    <div
      class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      <div v-if="pending" class="p-8 text-center text-gray-400">
        Chargement...
      </div>
      <div
        v-else-if="!events?.data?.length"
        class="p-8 text-center text-gray-400"
      >
        Aucun événement.
      </div>
      <table v-else class="w-full text-sm">
        <thead
          class="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 uppercase text-xs"
        >
          <tr>
            <th class="px-4 py-3 text-left">Titre</th>
            <th class="px-4 py-3 text-left">Type</th>
            <th class="px-4 py-3 text-left">Date</th>
            <th class="px-4 py-3 text-center">Inscriptions</th>
            <th class="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
          <tr
            v-for="event in events.data"
            :key="event.id"
            class="hover:bg-gray-50 dark:hover:bg-gray-700/50"
          >
            <td class="px-4 py-3">
              <p class="font-medium text-gray-900 dark:text-white">
                {{ event.title }}
              </p>
              <p class="text-xs text-gray-400">
                {{ event.location ?? "—" }}
              </p>
            </td>
            <td class="px-4 py-3">
              <span
                :class="[
                  getEventTypeConfig(event.type).class,
                  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                ]"
              >
                {{ getEventTypeConfig(event.type).label }}
              </span>
            </td>
            <td class="px-4 py-3 text-gray-600 dark:text-gray-300">
              {{ formatDate(event.startDate) }}
            </td>
            <td class="px-4 py-3 text-center">
              <UButton
                size="xs"
                :variant="event.isRegistrationOpen ? 'solid' : 'outline'"
                :color="event.isRegistrationOpen ? 'success' : 'neutral'"
                @click="toggleRegistration(event)"
              >
                {{ event.isRegistrationOpen ? "Ouvertes" : "Fermées" }}
              </UButton>
            </td>
            <td class="px-4 py-3 text-right">
              <div class="flex items-center justify-end gap-2">
                <UButton
                  size="sm"
                  variant="ghost"
                  icon="i-heroicons-pencil"
                  color="neutral"
                  @click="openEdit(event)"
                />
                <UButton
                  size="sm"
                  variant="ghost"
                  color="error"
                  icon="i-heroicons-trash"
                  @click="confirmDelete(event)"
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal créer / éditer -->
    <UModal
      v-model:open="modalOpen"
      :ui="{
        content:
          'ring-0 outline-none focus:outline-none focus:ring-0 focus-visible:ring-0',
      }"
    >
      <template #content>
        <div class="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ editing ? "Modifier l'événement" : "Nouvel événement" }}
          </h3>

          <form class="space-y-4" @submit.prevent="save">
            <div class="grid grid-cols-2 gap-4">
              <UFormField
                label="Titre"
                name="title"
                :error="errors.title"
                class="col-span-2"
                required
              >
                <UInput
                  v-model="form.title"
                  placeholder="Tournoi open..."
                  class="w-full"
                />
              </UFormField>

              <UFormField
                label="Slug"
                name="slug"
                :error="errors.slug"
                required
              >
                <UInput
                  v-model="form.slug"
                  placeholder="tournoi-open-2026"
                  class="w-full"
                />
              </UFormField>

              <UFormField
                label="Type"
                name="type"
                :error="errors.type"
                required
              >
                <USelect v-model="form.type" :items="eventTypes" />
              </UFormField>

              <UFormField
                label="Date de début"
                name="startDate"
                :error="errors.startDate"
                required
              >
                <UInput
                  v-model="form.startDate"
                  type="datetime-local"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Date de fin" name="endDate">
                <UInput
                  v-model="form.endDate"
                  type="datetime-local"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Lieu" name="location" class="col-span-2">
                <UInput
                  v-model="form.location"
                  placeholder="Salle omnisports de Libercourt"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Participants max" name="maxParticipants">
                <UInput
                  v-model.number="form.maxParticipants"
                  type="number"
                  min="0"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Prix (en €)" name="price">
                <UInput
                  v-model.number="form.price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0 = gratuit"
                  class="w-full"
                />
              </UFormField>

              <UFormField
                label="Description"
                name="description"
                class="col-span-2"
              >
                <UTextarea
                  v-model="form.description"
                  :rows="3"
                  class="w-full"
                />
              </UFormField>
            </div>

            <div class="flex justify-end gap-3 pt-2">
              <UButton
                variant="ghost"
                color="neutral"
                @click="modalOpen = false"
              >
                Annuler
              </UButton>
              <UButton type="submit" :loading="saving">
                {{ editing ? "Enregistrer" : "Créer" }}
              </UButton>
            </div>
          </form>
        </div>
      </template>
    </UModal>

    <!-- Modal suppression -->
    <UModal
      v-model:open="deleteModalOpen"
      :ui="{
        content:
          'ring-0 outline-none focus:outline-none focus:ring-0 focus-visible:ring-0',
      }"
    >
      <template #content>
        <div class="p-6 space-y-4">
          <h3 class="text-lg font-semibold">
            Supprimer "{{ eventToDelete?.title }}" ?
          </h3>
          <p class="text-sm text-red-600">Cette action est irréversible.</p>
          <div class="flex justify-end gap-3">
            <UButton
              variant="ghost"
              color="neutral"
              @click="deleteModalOpen = false"
            >
              Annuler
            </UButton>
            <UButton color="error" :loading="deleting" @click="doDelete">
              Supprimer
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { z } from "zod";

defineOptions({ name: "AdminEventsPage" });
definePageMeta({ layout: "admin", middleware: "admin" });
useSeoMeta({ title: "Admin — Événements", robots: "noindex,nofollow" });

const toast = useToast();

const { data: events, pending, refresh } = await useFetch("/api/admin/events");

const eventTypes = [
  { label: "Tournoi", value: "tournament" },
  { label: "Entraînement", value: "training" },
  { label: "Social", value: "social" },
  { label: "Autre", value: "other" },
];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Formulaire
// ---------------------------------------------------------------------------

const createEventSchema = z.object({
  title: z.string().min(3).max(200),
  slug: z
    .string()
    .min(3)
    .max(100)
    .regex(/^[a-z0-9-]+$/),
  type: z.enum(["tournament", "training", "social", "other"]),
  startDate: z.string().min(1, "Date requise"),
  endDate: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  maxParticipants: z.number().int().positive().optional(),
  price: z.number().min(0).optional(),
});

type EventForm = z.infer<typeof createEventSchema>;

const modalOpen = ref(false);
const saving = ref(false);
const editing = ref<{ id: number } | null>(null);

const form = reactive<EventForm>({
  title: "",
  slug: "",
  type: "tournament",
  startDate: "",
  endDate: "",
  location: "",
  description: "",
  maxParticipants: undefined,
  price: undefined,
});

const errors = reactive<Partial<Record<keyof EventForm, string>>>({});

function resetForm() {
  Object.assign(form, {
    title: "",
    slug: "",
    type: "tournament",
    startDate: "",
    endDate: "",
    location: "",
    description: "",
    maxParticipants: undefined,
    price: undefined,
  });
}

function openCreate() {
  editing.value = null;
  resetForm();
  modalOpen.value = true;
}

function toDatetimeLocal(iso: unknown) {
  if (!iso) return "";
  return new Date(iso as string).toISOString().slice(0, 16);
}

function openEdit(event: Record<string, unknown>) {
  editing.value = { id: event.id as number };
  Object.assign(form, {
    title: event.title,
    slug: event.slug,
    type: event.type,
    startDate: toDatetimeLocal(event.startDate),
    endDate: toDatetimeLocal(event.endDate),
    location: event.location ?? "",
    description: event.description ?? "",
    maxParticipants:
      event.maxParticipants != null
        ? (event.maxParticipants as number)
        : undefined,
    price: event.price != null ? Number(event.price) : undefined,
  });
  modalOpen.value = true;
}

async function save() {
  const result = createEventSchema.safeParse(form);
  if (!result.success) {
    result.error.issues.forEach((issue) => {
      const field = issue.path[0] as keyof EventForm;
      errors[field] = issue.message;
    });
    return;
  }
  Object.keys(errors).forEach(
    (k) => (errors[k as keyof EventForm] = undefined),
  );

  saving.value = true;
  try {
    if (editing.value) {
      await $fetch(`/api/admin/events/${editing.value.id}`, {
        method: "PATCH",
        body: result.data,
      });
      toast.add({ title: "Événement mis à jour", color: "success" });
    } else {
      await $fetch("/api/admin/events", { method: "POST", body: result.data });
      toast.add({ title: "Événement créé", color: "success" });
    }
    modalOpen.value = false;
    await refresh();
  } catch {
    toast.add({ title: "Erreur lors de la sauvegarde", color: "error" });
  } finally {
    saving.value = false;
  }
}

async function toggleRegistration(event: Record<string, unknown>) {
  try {
    await $fetch(`/api/admin/events/${event.id}`, {
      method: "PATCH",
      body: { isRegistrationOpen: !event.isRegistrationOpen },
    });
    await refresh();
  } catch {
    toast.add({ title: "Erreur", color: "error" });
  }
}

// ---------------------------------------------------------------------------
// Suppression
// ---------------------------------------------------------------------------

const deleteModalOpen = ref(false);
const deleting = ref(false);
const eventToDelete = ref<Record<string, unknown> | null>(null);

function confirmDelete(event: Record<string, unknown>) {
  eventToDelete.value = event;
  deleteModalOpen.value = true;
}

async function doDelete() {
  if (!eventToDelete.value) return;
  deleting.value = true;
  try {
    await $fetch(`/api/admin/events/${eventToDelete.value.id}`, {
      method: "DELETE",
    });
    toast.add({ title: "Événement supprimé", color: "success" });
    deleteModalOpen.value = false;
    await refresh();
  } catch {
    toast.add({ title: "Erreur lors de la suppression", color: "error" });
  } finally {
    deleting.value = false;
  }
}
</script>
