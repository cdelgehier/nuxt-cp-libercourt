<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <p class="text-sm text-gray-500 dark:text-gray-400">
        {{ schedules?.data?.length ?? 0 }} créneau(x)
      </p>
      <UButton icon="i-heroicons-plus" @click="openCreate">
        Nouveau créneau
      </UButton>
    </div>

    <div
      class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      <div v-if="pending" class="p-8 text-center text-gray-400">
        Chargement...
      </div>
      <div
        v-else-if="!schedules?.data?.length"
        class="p-8 text-center text-gray-400"
      >
        Aucun créneau.
      </div>
      <table v-else class="w-full text-sm">
        <thead
          class="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 uppercase text-xs"
        >
          <tr>
            <th class="px-4 py-3 text-left">Jour</th>
            <th class="px-4 py-3 text-left">Horaire</th>
            <th class="px-4 py-3 text-left">Catégorie</th>
            <th class="px-4 py-3 text-left">Niveau</th>
            <th class="px-4 py-3 text-center">Actif</th>
            <th class="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
          <tr
            v-for="schedule in schedules.data"
            :key="schedule.id"
            class="hover:bg-gray-50 dark:hover:bg-gray-700/50"
          >
            <td class="px-4 py-3 font-medium text-gray-900 dark:text-white">
              {{ schedule.day }}
            </td>
            <td class="px-4 py-3 text-gray-600 dark:text-gray-300 font-mono">
              {{ schedule.timeStart }} – {{ schedule.timeEnd }}
            </td>
            <td class="px-4 py-3 text-gray-600 dark:text-gray-300">
              {{ schedule.category }}
            </td>
            <td class="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
              {{ schedule.level ?? "—" }}
            </td>
            <td class="px-4 py-3 text-center">
              <UBadge
                :color="schedule.active ? 'success' : 'neutral'"
                variant="subtle"
                size="sm"
              >
                {{ schedule.active ? "Actif" : "Inactif" }}
              </UBadge>
            </td>
            <td class="px-4 py-3 text-right">
              <div class="flex items-center justify-end gap-2">
                <UButton
                  size="sm"
                  variant="ghost"
                  icon="i-heroicons-pencil"
                  color="neutral"
                  @click="openEdit(schedule)"
                />
                <UButton
                  size="sm"
                  variant="ghost"
                  color="error"
                  icon="i-heroicons-trash"
                  @click="confirmDelete(schedule)"
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <UModal
      v-model:open="modalOpen"
      :ui="{
        content:
          'ring-0 outline-none focus:outline-none focus:ring-0 focus-visible:ring-0',
      }"
    >
      <template #content>
        <div class="p-6 space-y-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ editing ? "Modifier le créneau" : "Nouveau créneau" }}
          </h3>
          <form class="space-y-4" @submit.prevent="save">
            <div class="grid grid-cols-2 gap-4">
              <UFormField label="Jour" name="day" required>
                <USelect v-model="form.day" :items="days" />
              </UFormField>
              <UFormField label="Ordre" name="dayOrder">
                <UInput
                  v-model.number="form.dayOrder"
                  type="number"
                  min="1"
                  max="7"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Début" name="timeStart" required>
                <UInput
                  v-model="form.timeStart"
                  placeholder="17:30"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Fin" name="timeEnd" required>
                <UInput
                  v-model="form.timeEnd"
                  placeholder="20:30"
                  class="w-full"
                />
              </UFormField>
              <UFormField
                label="Catégorie"
                name="category"
                class="col-span-2"
                required
              >
                <UInput
                  v-model="form.category"
                  placeholder="Entraînement, Jeu libre..."
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Niveau" name="level" class="col-span-2">
                <UInput
                  v-model="form.level"
                  placeholder="Tous niveaux, Débutants..."
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Coach" name="coach" class="col-span-2">
                <UInput
                  v-model="form.coach"
                  placeholder="Prénom NOM"
                  class="w-full"
                />
              </UFormField>
            </div>
            <UFormField label="Actif" name="active">
              <UCheckbox v-model="form.active" label="Créneau actif" />
            </UFormField>
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
          <h3 class="text-lg font-semibold">Supprimer ce créneau ?</h3>
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
defineOptions({ name: "AdminSchedulesPage" });
definePageMeta({ layout: "admin", middleware: "admin" });
useSeoMeta({ title: "Admin — Créneaux", robots: "noindex,nofollow" });

const toast = useToast();

const {
  data: schedules,
  pending,
  refresh,
} = await useFetch("/api/admin/schedules");

const days = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
];

const modalOpen = ref(false);
const saving = ref(false);
const editing = ref<{ id: number } | null>(null);

const form = reactive({
  day: "Lundi",
  dayOrder: 1,
  timeStart: "",
  timeEnd: "",
  category: "",
  level: "",
  coach: "",
  active: true,
});

function resetForm() {
  Object.assign(form, {
    day: "Lundi",
    dayOrder: 1,
    timeStart: "",
    timeEnd: "",
    category: "",
    level: "",
    coach: "",
    active: true,
  });
}

function openCreate() {
  editing.value = null;
  resetForm();
  modalOpen.value = true;
}

function openEdit(s: Record<string, unknown>) {
  editing.value = { id: s.id as number };
  Object.assign(form, {
    day: s.day,
    dayOrder: s.dayOrder,
    timeStart: s.timeStart,
    timeEnd: s.timeEnd,
    category: s.category,
    level: s.level ?? "",
    coach: s.coach ?? "",
    active: s.active ?? true,
  });
  modalOpen.value = true;
}

async function save() {
  saving.value = true;
  try {
    if (editing.value) {
      await $fetch(`/api/admin/schedules/${editing.value.id}`, {
        method: "PATCH",
        body: form,
      });
      toast.add({ title: "Créneau mis à jour", color: "success" });
    } else {
      await $fetch("/api/admin/schedules", { method: "POST", body: form });
      toast.add({ title: "Créneau créé", color: "success" });
    }
    modalOpen.value = false;
    await refresh();
  } catch {
    toast.add({ title: "Erreur lors de la sauvegarde", color: "error" });
  } finally {
    saving.value = false;
  }
}

const deleteModalOpen = ref(false);
const deleting = ref(false);
const toDelete = ref<Record<string, unknown> | null>(null);

function confirmDelete(s: Record<string, unknown>) {
  toDelete.value = s;
  deleteModalOpen.value = true;
}

async function doDelete() {
  if (!toDelete.value) return;
  deleting.value = true;
  try {
    await $fetch(`/api/admin/schedules/${toDelete.value.id}`, {
      method: "DELETE",
    });
    toast.add({ title: "Créneau supprimé", color: "success" });
    deleteModalOpen.value = false;
    await refresh();
  } catch {
    toast.add({ title: "Erreur", color: "error" });
  } finally {
    deleting.value = false;
  }
}
</script>
