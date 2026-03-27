<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <p class="text-sm text-gray-500 dark:text-gray-400">
        {{ members?.data?.length ?? 0 }} membre(s) du bureau
      </p>
      <UButton icon="i-heroicons-plus" @click="openCreate">
        Nouveau membre
      </UButton>
    </div>

    <div
      class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      <div v-if="pending" class="p-8 text-center text-gray-400">
        Chargement...
      </div>
      <div
        v-else-if="!members?.data?.length"
        class="p-8 text-center text-gray-400"
      >
        Aucun membre du bureau.
      </div>
      <table v-else class="w-full text-sm">
        <thead
          class="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 uppercase text-xs"
        >
          <tr>
            <th class="px-4 py-3 text-left">Nom</th>
            <th class="px-4 py-3 text-left">Rôle</th>
            <th class="px-4 py-3 text-left">Email</th>
            <th class="px-4 py-3 text-center">Actif</th>
            <th class="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
          <tr
            v-for="member in members.data"
            :key="member.id"
            class="hover:bg-gray-50 dark:hover:bg-gray-700/50"
          >
            <td class="px-4 py-3 font-medium text-gray-900 dark:text-white">
              {{ member.firstName }} {{ member.lastName }}
            </td>
            <td class="px-4 py-3 text-gray-600 dark:text-gray-300">
              {{ member.fullRole ?? member.role }}
            </td>
            <td class="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
              {{ member.email ?? "—" }}
            </td>
            <td class="px-4 py-3 text-center">
              <UBadge
                :color="member.active ? 'success' : 'neutral'"
                variant="subtle"
                size="sm"
              >
                {{ member.active ? "Actif" : "Inactif" }}
              </UBadge>
            </td>
            <td class="px-4 py-3 text-right">
              <div class="flex items-center justify-end gap-2">
                <UButton
                  size="sm"
                  variant="ghost"
                  icon="i-heroicons-pencil"
                  color="neutral"
                  @click="openEdit(member)"
                />
                <UButton
                  size="sm"
                  variant="ghost"
                  color="error"
                  icon="i-heroicons-trash"
                  @click="confirmDelete(member)"
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
        <div class="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ editing ? "Modifier le membre" : "Nouveau membre" }}
          </h3>
          <form class="space-y-4" @submit.prevent="save">
            <div class="grid grid-cols-2 gap-4">
              <UFormField label="Prénom" name="firstName" required>
                <UInput v-model="form.firstName" class="w-full" />
              </UFormField>
              <UFormField label="Nom" name="lastName" required>
                <UInput v-model="form.lastName" class="w-full" />
              </UFormField>
              <UFormField label="Rôle (clé)" name="role" required>
                <UInput
                  v-model="form.role"
                  placeholder="president, secretary..."
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Rôle (libellé)" name="fullRole">
                <UInput
                  v-model="form.fullRole"
                  placeholder="Président du club"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Email" name="email">
                <UInput v-model="form.email" type="email" class="w-full" />
              </UFormField>
              <UFormField label="Téléphone" name="phone">
                <UInput v-model="form.phone" class="w-full" />
              </UFormField>
              <UFormField label="Bio" name="bio" class="col-span-2">
                <UTextarea v-model="form.bio" :rows="3" class="w-full" />
              </UFormField>
            </div>
            <UFormField label="Actif" name="active">
              <UCheckbox v-model="form.active" label="Membre actif" />
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
            Supprimer "{{ toDelete?.firstName }} {{ toDelete?.lastName }}" ?
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
defineOptions({ name: "AdminTeamMembersPage" });
definePageMeta({ layout: "admin", middleware: "admin" });
useSeoMeta({ title: "Admin — Bureau", robots: "noindex,nofollow" });

const toast = useToast();

const {
  data: members,
  pending,
  refresh,
} = await useFetch("/api/admin/team-members");

const modalOpen = ref(false);
const saving = ref(false);
const editing = ref<{ id: number } | null>(null);

const form = reactive({
  firstName: "",
  lastName: "",
  role: "",
  fullRole: "",
  email: "",
  phone: "",
  bio: "",
  active: true,
});

function resetForm() {
  Object.assign(form, {
    firstName: "",
    lastName: "",
    role: "",
    fullRole: "",
    email: "",
    phone: "",
    bio: "",
    active: true,
  });
}

function openCreate() {
  editing.value = null;
  resetForm();
  modalOpen.value = true;
}

function openEdit(m: Record<string, unknown>) {
  editing.value = { id: m.id as number };
  Object.assign(form, {
    firstName: m.firstName,
    lastName: m.lastName,
    role: m.role,
    fullRole: m.fullRole ?? "",
    email: m.email ?? "",
    phone: m.phone ?? "",
    bio: m.bio ?? "",
    active: m.active ?? true,
  });
  modalOpen.value = true;
}

async function save() {
  saving.value = true;
  try {
    if (editing.value) {
      await $fetch(`/api/admin/team-members/${editing.value.id}`, {
        method: "PATCH",
        body: form,
      });
      toast.add({ title: "Membre mis à jour", color: "success" });
    } else {
      await $fetch("/api/admin/team-members", { method: "POST", body: form });
      toast.add({ title: "Membre créé", color: "success" });
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

function confirmDelete(m: Record<string, unknown>) {
  toDelete.value = m;
  deleteModalOpen.value = true;
}

async function doDelete() {
  if (!toDelete.value) return;
  deleting.value = true;
  try {
    await $fetch(`/api/admin/team-members/${toDelete.value.id}`, {
      method: "DELETE",
    });
    toast.add({ title: "Membre supprimé", color: "success" });
    deleteModalOpen.value = false;
    await refresh();
  } catch {
    toast.add({ title: "Erreur", color: "error" });
  } finally {
    deleting.value = false;
  }
}
</script>
