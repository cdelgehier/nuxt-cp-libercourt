<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <p class="text-sm text-gray-500 dark:text-gray-400">
        {{ sponsors?.data?.length ?? 0 }} sponsor(s)
      </p>
      <UButton icon="i-heroicons-plus" @click="openCreate">
        Nouveau sponsor
      </UButton>
    </div>

    <div
      class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      <div v-if="pending" class="p-8 text-center text-gray-400">
        Chargement...
      </div>
      <div
        v-else-if="!sponsors?.data?.length"
        class="p-8 text-center text-gray-400"
      >
        Aucun sponsor.
      </div>
      <table v-else class="w-full text-sm">
        <thead
          class="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 uppercase text-xs"
        >
          <tr>
            <th class="px-4 py-3 text-left">Nom</th>
            <th class="px-4 py-3 text-left">Catégorie</th>
            <th class="px-4 py-3 text-left">Site web</th>
            <th class="px-4 py-3 text-center">Actif</th>
            <th class="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
          <tr
            v-for="sponsor in sponsors.data"
            :key="sponsor.id"
            class="hover:bg-gray-50 dark:hover:bg-gray-700/50"
          >
            <td class="px-4 py-3 font-medium text-gray-900 dark:text-white">
              {{ sponsor.name }}
            </td>
            <td class="px-4 py-3">
              <UBadge
                :color="categoryColor(sponsor.category)"
                variant="subtle"
                size="sm"
              >
                {{ sponsor.category }}
              </UBadge>
            </td>
            <td class="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
              {{ sponsor.website ?? "—" }}
            </td>
            <td class="px-4 py-3 text-center">
              <UBadge
                :color="sponsor.active ? 'success' : 'neutral'"
                variant="subtle"
                size="sm"
              >
                {{ sponsor.active ? "Actif" : "Inactif" }}
              </UBadge>
            </td>
            <td class="px-4 py-3 text-right">
              <div class="flex items-center justify-end gap-2">
                <UButton
                  size="sm"
                  variant="ghost"
                  icon="i-heroicons-pencil"
                  color="neutral"
                  @click="openEdit(sponsor)"
                />
                <UButton
                  size="sm"
                  variant="ghost"
                  color="error"
                  icon="i-heroicons-trash"
                  @click="confirmDelete(sponsor)"
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
            {{ editing ? "Modifier le sponsor" : "Nouveau sponsor" }}
          </h3>
          <form class="space-y-4" @submit.prevent="save">
            <UFormField label="Nom" name="name" required>
              <UInput
                v-model="form.name"
                placeholder="Nom de l'entreprise"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Catégorie" name="category" required>
              <USelect v-model="form.category" :items="categories" />
            </UFormField>
            <UFormField label="Site web" name="website">
              <UInput
                v-model="form.website"
                placeholder="https://..."
                class="w-full"
              />
            </UFormField>
            <UFormField label="Logo (URL ou chemin)" name="logo">
              <UInput
                v-model="form.logo"
                placeholder="/sponsors/logo.webp"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Description" name="description">
              <UTextarea v-model="form.description" :rows="2" class="w-full" />
            </UFormField>
            <UFormField label="Actif" name="active">
              <UCheckbox v-model="form.active" label="Sponsor actif" />
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
          <h3 class="text-lg font-semibold">
            Supprimer "{{ toDelete?.name }}" ?
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
defineOptions({ name: "AdminSponsorsPage" });
definePageMeta({ layout: "admin", middleware: "admin" });
useSeoMeta({ title: "Admin — Sponsors", robots: "noindex,nofollow" });

const toast = useToast();

const {
  data: sponsors,
  pending,
  refresh,
} = await useFetch("/api/admin/sponsors");

const categories = [
  { label: "Partenaire", value: "partenaire" },
  { label: "Sponsor", value: "sponsor" },
  { label: "Institutionnel", value: "institutionnel" },
];

function categoryColor(cat: string) {
  if (cat === "partenaire") return "info";
  if (cat === "institutionnel") return "secondary";
  return "neutral";
}

const modalOpen = ref(false);
const saving = ref(false);
const editing = ref<{ id: number } | null>(null);

const form = reactive({
  name: "",
  category: "sponsor",
  website: "",
  logo: "",
  description: "",
  active: true,
});

function resetForm() {
  Object.assign(form, {
    name: "",
    category: "sponsor",
    website: "",
    logo: "",
    description: "",
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
    name: s.name,
    category: s.category ?? "bronze",
    website: s.website ?? "",
    logo: s.logo ?? "",
    description: s.description ?? "",
    active: s.active ?? true,
  });
  modalOpen.value = true;
}

async function save() {
  saving.value = true;
  try {
    if (editing.value) {
      await $fetch(`/api/admin/sponsors/${editing.value.id}`, {
        method: "PATCH",
        body: form,
      });
      toast.add({ title: "Sponsor mis à jour", color: "success" });
    } else {
      await $fetch("/api/admin/sponsors", { method: "POST", body: form });
      toast.add({ title: "Sponsor créé", color: "success" });
    }
    modalOpen.value = false;
    await refresh();
  } catch {
    toast.add({ title: "Erreur", color: "error" });
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
    await $fetch(`/api/admin/sponsors/${toDelete.value.id}`, {
      method: "DELETE",
    });
    toast.add({ title: "Sponsor supprimé", color: "success" });
    deleteModalOpen.value = false;
    await refresh();
  } catch {
    toast.add({ title: "Erreur", color: "error" });
  } finally {
    deleting.value = false;
  }
}
</script>
