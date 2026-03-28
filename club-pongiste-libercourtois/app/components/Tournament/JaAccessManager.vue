<script setup lang="ts">
import {
  createJaAccessInputSchema,
  type TournamentJaAccess,
} from "~~/server/domains/tournament/types";

const props = defineProps<{
  accesses: TournamentJaAccess[];
  slug: string;
  tournamentId: number;
}>();

const emit = defineEmits<{ refresh: [] }>();
const toast = useToast();

const modalOpen = ref(false);
const saving = ref(false);

const form = reactive({ name: "", pin: "" });
const errors = reactive<Record<string, string>>({});

const schema = createJaAccessInputSchema;

function resetForm() {
  form.name = "";
  form.pin = "";
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
    await $fetch(`/api/admin/tournois/${props.slug}/ja-access`, {
      method: "POST",
      body: form,
    });
    toast.add({ title: "Code JA créé", color: "success" });
    emit("refresh");
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

async function toggleActive(access: TournamentJaAccess) {
  try {
    await $fetch(`/api/admin/tournois/${props.slug}/ja-access/${access.id}`, {
      method: "PATCH",
      body: { isActive: !access.isActive },
    });
    emit("refresh");
  } catch {
    toast.add({ title: "Erreur", color: "error" });
  }
}

async function remove(id: number) {
  try {
    await $fetch(`/api/admin/tournois/${props.slug}/ja-access/${id}`, {
      method: "DELETE",
    });
    emit("refresh");
    toast.add({ title: "Accès supprimé", color: "success" });
  } catch {
    toast.add({ title: "Erreur", color: "error" });
  }
}

function formatDate(d: Date | string | null): string {
  if (!d) return "Jamais";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(d));
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex justify-end">
      <UButton icon="i-heroicons-plus" size="sm" @click="modalOpen = true">
        Créer un accès JA
      </UButton>
    </div>

    <div v-if="accesses.length === 0" class="text-center text-gray-400 py-6">
      Aucun code JA créé
    </div>

    <table v-else class="w-full text-sm">
      <thead class="bg-gray-50 text-gray-500 uppercase text-xs">
        <tr>
          <th class="px-4 py-2 text-left">Juge Arbitre</th>
          <th class="px-4 py-2 text-left">Statut</th>
          <th class="px-4 py-2 text-left">Dernière utilisation</th>
          <th class="px-4 py-2" />
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100">
        <tr
          v-for="access in accesses"
          :key="access.id"
          class="hover:bg-gray-50"
        >
          <td class="px-4 py-2 font-medium">{{ access.name }}</td>
          <td class="px-4 py-2">
            <UBadge
              :color="access.isActive ? 'success' : 'neutral'"
              variant="subtle"
              size="sm"
            >
              {{ access.isActive ? "Actif" : "Désactivé" }}
            </UBadge>
          </td>
          <td class="px-4 py-2 text-gray-500">
            {{ formatDate(access.lastUsedAt) }}
          </td>
          <td class="px-4 py-2">
            <div class="flex gap-2 justify-end">
              <UButton
                size="xs"
                :variant="access.isActive ? 'outline' : 'solid'"
                :color="access.isActive ? 'neutral' : 'success'"
                @click="toggleActive(access)"
              >
                {{ access.isActive ? "Désactiver" : "Activer" }}
              </UButton>
              <UButton
                size="xs"
                variant="ghost"
                color="error"
                icon="i-heroicons-trash"
                @click="remove(access.id)"
              />
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Create modal -->
    <UModal v-model:open="modalOpen">
      <template #content>
        <div class="p-6 space-y-4">
          <h3 class="font-semibold text-lg">Créer un accès Juge Arbitre</h3>
          <UFormField
            label="Nom du JA"
            hint='Ex : "Marc Dupont" ou "JA Fédération"'
            :error="errors.name"
            required
          >
            <UInput v-model="form.name" placeholder="Marc Dupont" />
          </UFormField>
          <UFormField
            label="Code PIN (4 à 6 chiffres)"
            :error="errors.pin"
            required
          >
            <UInput
              v-model="form.pin"
              type="password"
              placeholder="••••"
              class="font-mono"
            />
          </UFormField>
          <div class="flex justify-end gap-2">
            <UButton
              variant="ghost"
              color="neutral"
              @click="
                modalOpen = false;
                resetForm();
              "
            >
              Annuler
            </UButton>
            <UButton :loading="saving" @click="create"> Créer </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
