<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <p class="text-sm text-gray-500 dark:text-gray-400">
        {{ pricing?.data?.length ?? 0 }} tarif(s)
      </p>
      <UButton icon="i-heroicons-plus" @click="openCreate">
        Nouveau tarif
      </UButton>
    </div>

    <div
      class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      <div v-if="pending" class="p-8 text-center text-gray-400">
        Chargement...
      </div>
      <div
        v-else-if="!pricing?.data?.length"
        class="p-8 text-center text-gray-400"
      >
        Aucun tarif.
      </div>
      <table v-else class="w-full text-sm">
        <thead
          class="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 uppercase text-xs"
        >
          <tr>
            <th class="px-4 py-3 text-left">Catégorie</th>
            <th class="px-4 py-3 text-left">Tranche d'âge</th>
            <th class="px-4 py-3 text-right">Prix</th>
            <th class="px-4 py-3 text-center">Réduction</th>
            <th class="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
          <tr
            v-for="p in pricing.data"
            :key="p.id"
            class="hover:bg-gray-50 dark:hover:bg-gray-700/50"
          >
            <td class="px-4 py-3 font-medium text-gray-900 dark:text-white">
              {{ p.category }}
            </td>
            <td class="px-4 py-3 text-gray-600 dark:text-gray-300">
              {{ p.ageRange ?? "—" }}
            </td>
            <td
              class="px-4 py-3 text-right font-mono text-gray-900 dark:text-white"
            >
              {{
                p.isReduction
                  ? p.reductionAmount
                    ? `- ${formatPrice(p.reductionAmount)}`
                    : "—"
                  : formatPrice(p.price)
              }}
            </td>
            <td class="px-4 py-3 text-center">
              <UBadge
                v-if="p.isReduction"
                color="info"
                variant="subtle"
                size="sm"
              >
                {{ p.reductionLabel ?? "Réduction" }}
              </UBadge>
              <span v-else class="text-gray-400">—</span>
            </td>
            <td class="px-4 py-3 text-right">
              <div class="flex items-center justify-end gap-2">
                <UButton
                  size="sm"
                  variant="ghost"
                  icon="i-heroicons-pencil"
                  color="neutral"
                  @click="openEdit(p)"
                />
                <UButton
                  size="sm"
                  variant="ghost"
                  color="error"
                  icon="i-heroicons-trash"
                  @click="confirmDelete(p)"
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
            {{ editing ? "Modifier le tarif" : "Nouveau tarif" }}
          </h3>
          <form class="space-y-4" @submit.prevent="save">
            <div class="grid grid-cols-2 gap-4">
              <UFormField
                label="Catégorie"
                name="category"
                class="col-span-2"
                required
              >
                <UInput
                  v-model="form.category"
                  placeholder="Licence Loisir, Compétition..."
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Tranche d'âge" name="ageRange">
                <UInput
                  v-model="form.ageRange"
                  placeholder="Adulte, Jeune (-18 ans)..."
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Prix (€)" name="price" required>
                <UInput
                  v-model.number="form.price"
                  type="number"
                  min="0"
                  step="0.01"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Détails" name="details" class="col-span-2">
                <UTextarea
                  v-model="form.details"
                  :rows="2"
                  placeholder="Informations complémentaires..."
                  class="w-full"
                />
              </UFormField>
            </div>
            <UFormField label="Réduction" name="isReduction">
              <UCheckbox
                v-model="form.isReduction"
                label="C'est une réduction"
              />
            </UFormField>
            <div v-if="form.isReduction" class="grid grid-cols-2 gap-4">
              <UFormField label="Libellé réduction" name="reductionLabel">
                <UInput
                  v-model="form.reductionLabel"
                  placeholder="Pass'Sport État, Famille..."
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Montant réduction (€)" name="reductionAmount">
                <UInput
                  v-model.number="form.reductionAmount"
                  type="number"
                  min="0"
                  step="0.01"
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
          <h3 class="text-lg font-semibold">Supprimer ce tarif ?</h3>
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
defineOptions({ name: "AdminPricingPage" });
definePageMeta({ layout: "admin", middleware: "admin" });
useSeoMeta({ title: "Admin — Tarifs", robots: "noindex,nofollow" });

const toast = useToast();

const {
  data: pricing,
  pending,
  refresh,
} = await useFetch("/api/admin/pricing");

function formatPrice(euros: number | string) {
  return Number(euros).toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

const modalOpen = ref(false);
const saving = ref(false);
const editing = ref<{ id: number } | null>(null);

const form = reactive({
  category: "",
  ageRange: "",
  price: 0,
  details: "",
  isReduction: false,
  reductionLabel: "",
  reductionAmount: 0 as number | undefined,
});

function resetForm() {
  Object.assign(form, {
    category: "",
    ageRange: "",
    price: 0,
    details: "",
    isReduction: false,
    reductionLabel: "",
    reductionAmount: 0,
  });
}

function openCreate() {
  editing.value = null;
  resetForm();
  modalOpen.value = true;
}

function openEdit(p: Record<string, unknown>) {
  editing.value = { id: p.id as number };
  Object.assign(form, {
    category: p.category,
    ageRange: p.ageRange ?? "",
    price: p.price,
    details: p.details ?? "",
    isReduction: p.isReduction ?? false,
    reductionLabel: p.reductionLabel ?? "",
    reductionAmount: p.reductionAmount ?? 0,
  });
  modalOpen.value = true;
}

async function save() {
  saving.value = true;
  try {
    if (editing.value) {
      await $fetch(`/api/admin/pricing/${editing.value.id}`, {
        method: "PATCH",
        body: form,
      });
      toast.add({ title: "Tarif mis à jour", color: "success" });
    } else {
      await $fetch("/api/admin/pricing", { method: "POST", body: form });
      toast.add({ title: "Tarif créé", color: "success" });
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

function confirmDelete(p: Record<string, unknown>) {
  toDelete.value = p;
  deleteModalOpen.value = true;
}

async function doDelete() {
  if (!toDelete.value) return;
  deleting.value = true;
  try {
    await $fetch(`/api/admin/pricing/${toDelete.value.id}`, {
      method: "DELETE",
    });
    toast.add({ title: "Tarif supprimé", color: "success" });
    deleteModalOpen.value = false;
    await refresh();
  } catch {
    toast.add({ title: "Erreur", color: "error" });
  } finally {
    deleting.value = false;
  }
}
</script>
