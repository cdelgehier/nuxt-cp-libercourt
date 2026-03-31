<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <NuxtLink
          to="/admin/events"
          class="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-1 mb-1"
        >
          <UIcon name="i-heroicons-arrow-left" class="w-4 h-4" />
          Retour aux événements
        </NuxtLink>
        <h1 class="text-xl font-semibold text-gray-900 dark:text-white">
          {{ eventTitle }}
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {{ filteredRegistrations.length }} inscription(s) affichée(s)
          <span v-if="unpaidWithEmail.length > 0" class="ml-2 text-orange-600">
            — {{ unpaidWithEmail.length }} à relancer
          </span>
        </p>
      </div>
      <div class="flex items-center gap-2">
        <UButton
          v-if="unpaidWithEmail.length > 0"
          icon="i-heroicons-clipboard-document"
          color="orange"
          variant="soft"
          size="sm"
          @click="copyUnpaidEmails"
        >
          Copier les emails à relancer
        </UButton>
      </div>
    </div>

    <!-- Totaux financiers (événement payant uniquement) -->
    <div v-if="eventPrice > 0" class="grid grid-cols-3 gap-4">
      <div
        class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
      >
        <p
          class="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium"
        >
          Total dû
        </p>
        <p class="text-2xl font-semibold text-gray-900 dark:text-white mt-1">
          {{ formatAmount(totalDue) }}
        </p>
        <p class="text-xs text-gray-400 mt-0.5">
          {{ totalPersons }} personne{{ totalPersons > 1 ? "s" : "" }}
        </p>
      </div>
      <div
        class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
      >
        <p
          class="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium"
        >
          Déjà encaissé
        </p>
        <p
          class="text-2xl font-semibold text-green-600 dark:text-green-400 mt-1"
        >
          {{ formatAmount(totalPaid) }}
        </p>
        <p class="text-xs text-gray-400 mt-0.5">
          {{ paidPersons }} personne{{ paidPersons > 1 ? "s" : "" }}
        </p>
      </div>
      <div
        class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
      >
        <p
          class="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium"
        >
          Reste à percevoir
        </p>
        <p
          class="text-2xl font-semibold text-orange-600 dark:text-orange-400 mt-1"
        >
          {{ formatAmount(totalDue - totalPaid) }}
        </p>
        <p class="text-xs text-gray-400 mt-0.5">
          {{ unpaidPersons }} personne{{ unpaidPersons > 1 ? "s" : "" }}
        </p>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex gap-2">
      <UButton
        v-for="f in filters"
        :key="f.value"
        :variant="activeFilter === f.value ? 'solid' : 'soft'"
        size="sm"
        @click="activeFilter = f.value"
      >
        {{ f.label }}
        <span class="ml-1 text-xs opacity-70">({{ f.count }})</span>
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
        v-else-if="filteredRegistrations.length === 0"
        class="p-8 text-center text-gray-400"
      >
        Aucune inscription.
      </div>
      <table v-else class="w-full text-sm">
        <thead
          class="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 uppercase text-xs"
        >
          <tr>
            <th class="px-4 py-3 text-left">Nom</th>
            <th class="px-4 py-3 text-left">Accompagnants</th>
            <th class="px-4 py-3 text-left">Contact</th>
            <th class="px-4 py-3 text-left">Notes</th>
            <th v-if="eventPrice > 0" class="px-4 py-3 text-right">Montant</th>
            <th class="px-4 py-3 text-center">Payé</th>
            <th class="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
          <tr
            v-for="reg in filteredRegistrations"
            :key="reg.id"
            class="hover:bg-gray-50 dark:hover:bg-gray-700/50"
            :class="{ 'opacity-60': deletingId === reg.id }"
          >
            <td class="px-4 py-3">
              <p class="font-medium text-gray-900 dark:text-white">
                {{ reg.firstName }} {{ reg.lastName }}
              </p>
              <p class="text-xs text-gray-400">
                {{ formatDate(reg.registeredAt) }}
              </p>
            </td>
            <td class="px-4 py-3 text-gray-600 dark:text-gray-300">
              <span v-if="reg.companions > 0"> + {{ reg.companions }} </span>
              <span v-else class="text-gray-400">—</span>
            </td>
            <td class="px-4 py-3">
              <p v-if="reg.email" class="text-gray-700 dark:text-gray-300">
                {{ reg.email }}
              </p>
              <p v-if="reg.phone" class="text-xs text-gray-400">
                {{ reg.phone }}
              </p>
              <span v-if="!reg.email && !reg.phone" class="text-gray-400"
                >—</span
              >
            </td>
            <td class="px-4 py-3 max-w-xs">
              <p
                v-if="reg.notes"
                class="text-xs text-gray-500 dark:text-gray-400 truncate"
                :title="reg.notes"
              >
                {{ reg.notes }}
              </p>
              <span v-else class="text-gray-400">—</span>
            </td>
            <td
              v-if="eventPrice > 0"
              class="px-4 py-3 text-right font-medium text-gray-700 dark:text-gray-300"
            >
              {{ formatAmount(regAmount(reg)) }}
              <p class="text-xs text-gray-400 font-normal">
                {{ 1 + reg.companions }} × {{ formatAmount(eventPrice) }}
              </p>
            </td>
            <td class="px-4 py-3 text-center">
              <input
                type="checkbox"
                :checked="reg.isPaid"
                :disabled="togglingId === reg.id"
                class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                @change="togglePayment(reg)"
              />
            </td>
            <td class="px-4 py-3 text-right">
              <UButton
                icon="i-heroicons-trash"
                color="error"
                variant="ghost"
                size="xs"
                :loading="deletingId === reg.id"
                @click="confirmDelete(reg)"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Delete confirmation modal -->
    <UModal v-model:open="showDeleteModal">
      <template #content>
        <div class="p-6 space-y-4">
          <h3 class="font-semibold text-gray-900 dark:text-white">
            Supprimer inscription ?
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Supprimer
            <strong
              >{{ deletingReg?.firstName }} {{ deletingReg?.lastName }}</strong
            >
            de la liste ? Cette action est irréversible.
          </p>
          <div class="flex justify-end gap-2">
            <UButton
              variant="ghost"
              color="neutral"
              @click="showDeleteModal = false"
            >
              Annuler
            </UButton>
            <UButton color="error" :loading="!!deletingId" @click="doDelete">
              Supprimer
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: "EventRegistrations" });
definePageMeta({ layout: "admin", middleware: "admin" });

const route = useRoute();
const eventId = Number(route.params.id);
const toast = useToast();

interface Registration {
  id: number;
  firstName: string;
  lastName: string;
  companions: number;
  email: string | null;
  phone: string | null;
  notes: string | null;
  isPaid: boolean;
  registeredAt: string | null;
}

interface AdminRegistrationsResponse {
  event: { id: number; title: string; price: string | null };
  registrations: Registration[];
  count: number;
}

const { data, pending, refresh } = await useFetch<AdminRegistrationsResponse>(
  `/api/admin/events/${eventId}/registrations`,
);

const eventTitle = computed(() => data.value?.event?.title ?? "Événement");
const eventPrice = computed(
  () => parseFloat(data.value?.event?.price ?? "0") || 0,
);
const allRegistrations = computed(() => data.value?.registrations ?? []);

// Finance
const regAmount = (reg: Registration) =>
  eventPrice.value * (1 + reg.companions);
const totalDue = computed(() =>
  allRegistrations.value.reduce((s, r) => s + regAmount(r), 0),
);
const totalPaid = computed(() =>
  allRegistrations.value
    .filter((r) => r.isPaid)
    .reduce((s, r) => s + regAmount(r), 0),
);
const totalPersons = computed(() =>
  allRegistrations.value.reduce((s, r) => s + 1 + r.companions, 0),
);
const paidPersons = computed(() =>
  allRegistrations.value
    .filter((r) => r.isPaid)
    .reduce((s, r) => s + 1 + r.companions, 0),
);
const unpaidPersons = computed(() => totalPersons.value - paidPersons.value);
const formatAmount = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(
    n,
  );

// Filters
const activeFilter = ref<"all" | "paid" | "unpaid">("all");

const filters = computed(() => [
  {
    value: "all" as const,
    label: "Tous",
    count: allRegistrations.value.length,
  },
  {
    value: "paid" as const,
    label: "Payés",
    count: allRegistrations.value.filter((r) => r.isPaid).length,
  },
  {
    value: "unpaid" as const,
    label: "Non payés",
    count: allRegistrations.value.filter((r) => !r.isPaid).length,
  },
]);

const filteredRegistrations = computed(() => {
  if (activeFilter.value === "paid")
    return allRegistrations.value.filter((r) => r.isPaid);
  if (activeFilter.value === "unpaid")
    return allRegistrations.value.filter((r) => !r.isPaid);
  return allRegistrations.value;
});

const unpaidWithEmail = computed(() =>
  allRegistrations.value.filter((r) => !r.isPaid && r.email),
);

// Payment toggle
const togglingId = ref<number | null>(null);

const togglePayment = async (reg: Registration) => {
  togglingId.value = reg.id;
  try {
    await $fetch(`/api/admin/events/registrations/${reg.id}`, {
      method: "PATCH",
      body: { isPaid: !reg.isPaid },
    });
    await refresh();
  } catch {
    toast.add({ title: "Erreur lors de la mise à jour", color: "error" });
  } finally {
    togglingId.value = null;
  }
};

// Delete
const showDeleteModal = ref(false);
const deletingReg = ref<Registration | null>(null);
const deletingId = ref<number | null>(null);

const confirmDelete = (reg: Registration) => {
  deletingReg.value = reg;
  showDeleteModal.value = true;
};

const doDelete = async () => {
  if (!deletingReg.value) return;
  deletingId.value = deletingReg.value.id;
  try {
    await $fetch(`/api/admin/events/registrations/${deletingReg.value.id}`, {
      method: "DELETE",
    });
    showDeleteModal.value = false;
    await refresh();
    toast.add({ title: "Inscription supprimée", color: "success" });
  } catch {
    toast.add({ title: "Erreur lors de la suppression", color: "error" });
  } finally {
    deletingId.value = null;
    deletingReg.value = null;
  }
};

// Copy unpaid emails
const copyUnpaidEmails = async () => {
  const emails = unpaidWithEmail.value.map((r) => r.email).join(", ");
  await navigator.clipboard.writeText(emails);
  toast.add({
    title: `${unpaidWithEmail.value.length} email(s) copié(s)`,
    color: "success",
  });
};

// Utilities
const formatDate = (d: string | null) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};
</script>
