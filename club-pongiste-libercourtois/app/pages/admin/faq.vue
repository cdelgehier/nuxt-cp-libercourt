<template>
  <div class="space-y-6">
    <!-- Header actions -->
    <div class="flex items-center justify-between">
      <p class="text-sm text-gray-500 dark:text-gray-400">
        {{ faqs?.data?.length ?? 0 }} entrées
      </p>
      <UButton icon="i-heroicons-plus" @click="openCreate">
        Nouvelle FAQ
      </UButton>
    </div>

    <!-- Table -->
    <div
      class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      <div v-if="pending" class="p-8 text-center text-gray-400">
        Chargement...
      </div>
      <div
        v-else-if="!faqs?.data?.length"
        class="p-8 text-center text-gray-400"
      >
        Aucune FAQ. Créez la première entrée.
      </div>
      <table v-else class="w-full text-sm">
        <thead
          class="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 uppercase text-xs"
        >
          <tr>
            <th class="px-4 py-3 text-left">Question</th>
            <th class="px-4 py-3 text-left">Catégorie</th>
            <th class="px-4 py-3 text-center">Populaire</th>
            <th class="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
          <tr
            v-for="faq in faqs.data"
            :key="faq.id"
            class="hover:bg-gray-50 dark:hover:bg-gray-700/50"
          >
            <td class="px-4 py-3 max-w-xs">
              <p class="font-medium text-gray-900 dark:text-white truncate">
                {{ faq.question }}
              </p>
              <p
                class="text-gray-500 dark:text-gray-400 truncate text-xs mt-0.5"
              >
                {{ faq.answer }}
              </p>
            </td>
            <td class="px-4 py-3 text-gray-600 dark:text-gray-300">
              {{ faq.category }}
            </td>
            <td class="px-4 py-3 text-center">
              <UBadge
                :color="faq.isPopular ? 'success' : 'neutral'"
                variant="subtle"
                size="sm"
              >
                {{ faq.isPopular ? "Oui" : "Non" }}
              </UBadge>
            </td>
            <td class="px-4 py-3 text-right">
              <div class="flex items-center justify-end gap-2">
                <UButton
                  size="sm"
                  variant="ghost"
                  icon="i-heroicons-pencil"
                  color="neutral"
                  @click="openEdit(faq)"
                />
                <UButton
                  size="sm"
                  variant="ghost"
                  color="error"
                  icon="i-heroicons-trash"
                  @click="confirmDelete(faq)"
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
        <div class="p-6 space-y-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ editing ? "Modifier la FAQ" : "Nouvelle FAQ" }}
          </h3>

          <form class="space-y-4" @submit.prevent="save">
            <UFormField
              label="Question"
              name="question"
              :error="errors.question"
              required
            >
              <UInput
                v-model="form.question"
                placeholder="Ex : Comment s'inscrire au club ?"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="Réponse"
              name="answer"
              :error="errors.answer"
              required
            >
              <UTextarea
                v-model="form.answer"
                :rows="4"
                placeholder="Réponse complète..."
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="Catégorie"
              name="category"
              :error="errors.category"
              required
            >
              <UInput
                v-model="form.category"
                placeholder="Ex : Inscription, Compétition..."
                class="w-full"
              />
            </UFormField>

            <UFormField label="Populaire" name="isPopular">
              <UCheckbox
                v-model="form.isPopular"
                label="Afficher dans les questions populaires"
              />
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

    <!-- Modal confirmation suppression -->
    <UModal
      v-model:open="deleteModalOpen"
      :ui="{
        content:
          'ring-0 outline-none focus:outline-none focus:ring-0 focus-visible:ring-0',
      }"
    >
      <template #content>
        <div class="p-6 space-y-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Supprimer cette FAQ ?
          </h3>
          <p class="text-sm text-gray-500">"{{ faqToDelete?.question }}"</p>
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

defineOptions({ name: "AdminFaqPage" });
definePageMeta({ layout: "admin", middleware: "admin" });
useSeoMeta({ title: "Admin — FAQ", robots: "noindex,nofollow" });

const toast = useToast();

const { data: faqs, pending, refresh } = await useFetch("/api/admin/faqs");

// ---------------------------------------------------------------------------
// Formulaire
// ---------------------------------------------------------------------------

const createFaqSchema = z.object({
  question: z.string().min(5, "Question trop courte").max(500),
  answer: z.string().min(10, "Réponse trop courte").max(5000),
  category: z.string().min(1, "Catégorie requise"),
  isPopular: z.boolean().optional(),
});

type FaqForm = z.infer<typeof createFaqSchema>;

const modalOpen = ref(false);
const saving = ref(false);
const editing = ref<{ id: number } | null>(null);

const form = reactive<FaqForm & { isPopular: boolean }>({
  question: "",
  answer: "",
  category: "",
  isPopular: false,
});

const errors = reactive<Partial<Record<keyof FaqForm, string>>>({});

function resetForm() {
  form.question = "";
  form.answer = "";
  form.category = "";
  form.isPopular = false;
  errors.question = undefined;
  errors.answer = undefined;
  errors.category = undefined;
}

function openCreate() {
  editing.value = null;
  resetForm();
  modalOpen.value = true;
}

function openEdit(faq: Record<string, unknown>) {
  editing.value = { id: faq.id as number };
  form.question = faq.question as string;
  form.answer = faq.answer as string;
  form.category = faq.category as string;
  form.isPopular = (faq.isPopular as boolean) ?? false;
  modalOpen.value = true;
}

async function save() {
  // Validation Zod
  const result = createFaqSchema.safeParse(form);
  if (!result.success) {
    result.error.issues.forEach((issue) => {
      const field = issue.path[0] as keyof FaqForm;
      errors[field] = issue.message;
    });
    return;
  }
  Object.keys(errors).forEach((k) => (errors[k as keyof FaqForm] = undefined));

  saving.value = true;
  try {
    if (editing.value) {
      await $fetch(`/api/admin/faqs/${editing.value.id}`, {
        method: "PATCH",
        body: result.data,
      });
      toast.add({ title: "FAQ mise à jour", color: "success" });
    } else {
      await $fetch("/api/admin/faqs", { method: "POST", body: result.data });
      toast.add({ title: "FAQ créée", color: "success" });
    }
    modalOpen.value = false;
    await refresh();
  } catch {
    toast.add({ title: "Erreur lors de la sauvegarde", color: "error" });
  } finally {
    saving.value = false;
  }
}

// ---------------------------------------------------------------------------
// Suppression
// ---------------------------------------------------------------------------

const deleteModalOpen = ref(false);
const deleting = ref(false);
const faqToDelete = ref<Record<string, unknown> | null>(null);

function confirmDelete(faq: Record<string, unknown>) {
  faqToDelete.value = faq;
  deleteModalOpen.value = true;
}

async function doDelete() {
  if (!faqToDelete.value) return;
  deleting.value = true;
  try {
    await $fetch(`/api/admin/faqs/${faqToDelete.value.id}`, {
      method: "DELETE",
    });
    toast.add({ title: "FAQ supprimée", color: "success" });
    deleteModalOpen.value = false;
    await refresh();
  } catch {
    toast.add({ title: "Erreur lors de la suppression", color: "error" });
  } finally {
    deleting.value = false;
  }
}
</script>
