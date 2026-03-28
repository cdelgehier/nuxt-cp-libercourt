<script setup lang="ts">
import { z } from "zod";
import type { TournamentSeries } from "~~/server/domains/tournament/types";

const props = defineProps<{
  open: boolean;
  series: TournamentSeries;
  slug: string;
  apiBase?: string;
}>();

const base = computed(() => props.apiBase ?? `/api/admin/tournois`);

const emit = defineEmits<{ "update:open": [boolean]; refresh: [] }>();
const toast = useToast();
const saving = ref(false);

const isDoubles = computed(() => props.series.seriesFormat === "doubles");
const isHandicap = computed(() => props.series.seriesType === "handicap");

const form = reactive({
  firstName: "",
  lastName: "",
  club: "",
  licenceNumber: "",
  ranking: undefined as number | undefined,
  handicapPoints: 0,
  partnerFirstName: "",
  partnerLastName: "",
  partnerClub: "",
  partnerLicenceNumber: "",
  partnerRanking: undefined as number | undefined,
});

const errors = reactive<Record<string, string>>({});

const schema = computed(() =>
  z.object({
    firstName: z.string().min(1, "Requis"),
    lastName: z.string().min(1, "Requis"),
    club: z.string().optional(),
    licenceNumber: z.string().optional(),
    ranking: z.number().nonnegative().optional(),
    handicapPoints: z.number().int().default(0),
    ...(isDoubles.value
      ? {
          partnerFirstName: z.string().min(1, "Requis"),
          partnerLastName: z.string().min(1, "Requis"),
        }
      : {}),
  }),
);

function resetForm() {
  Object.assign(form, {
    firstName: "",
    lastName: "",
    club: "",
    licenceNumber: "",
    ranking: undefined,
    handicapPoints: 0,
    partnerFirstName: "",
    partnerLastName: "",
    partnerClub: "",
    partnerLicenceNumber: "",
    partnerRanking: undefined,
  });
  Object.keys(errors).forEach((k) => Reflect.deleteProperty(errors, k));
}

async function save() {
  const result = schema.value.safeParse(form);
  if (!result.success) {
    result.error.issues.forEach((issue) => {
      const field = String(issue.path[0]);
      errors[field] = issue.message;
    });
    return;
  }
  Object.keys(errors).forEach((k) => Reflect.deleteProperty(errors, k));
  saving.value = true;
  try {
    await $fetch(
      `${base.value}/${props.slug}/series/${props.series.id}/registrations`,
      { method: "POST", body: form },
    );
    toast.add({ title: "Joueur inscrit", color: "success" });
    emit("refresh");
    emit("update:open", false);
    resetForm();
  } catch (e: unknown) {
    const msg =
      (e as { data?: { message?: string } })?.data?.message ?? "Erreur";
    toast.add({ title: msg, color: "error" });
  } finally {
    saving.value = false;
  }
}

watch(
  () => props.open,
  (v) => {
    if (!v) resetForm();
  },
);
</script>

<template>
  <UModal :open="open" @update:open="$emit('update:open', $event)">
    <template #content>
      <div class="p-6 space-y-4">
        <h3 class="font-semibold text-lg">Inscrire un joueur</h3>

        <div class="grid grid-cols-2 gap-3">
          <UFormField label="Prénom" :error="errors.firstName" required>
            <UInput v-model="form.firstName" placeholder="Jean" />
          </UFormField>
          <UFormField label="Nom" :error="errors.lastName" required>
            <UInput v-model="form.lastName" placeholder="Dupont" />
          </UFormField>
          <UFormField label="Club">
            <UInput v-model="form.club" placeholder="CPL" />
          </UFormField>
          <UFormField label="N° Licence">
            <UInput v-model="form.licenceNumber" placeholder="123456X" />
          </UFormField>
          <UFormField label="Points FFTT">
            <UInput
              v-model.number="form.ranking"
              type="number"
              min="0"
              placeholder="750"
            />
          </UFormField>
          <UFormField v-if="isHandicap" label="Points de handicap">
            <UInput
              v-model.number="form.handicapPoints"
              type="number"
              placeholder="0"
            />
          </UFormField>
        </div>

        <!-- Partner section (doubles) -->
        <template v-if="isDoubles">
          <div class="border-t pt-4">
            <p class="text-sm font-medium text-gray-600 mb-3">Partenaire</p>
            <div class="grid grid-cols-2 gap-3">
              <UFormField
                label="Prénom"
                :error="errors.partnerFirstName"
                required
              >
                <UInput v-model="form.partnerFirstName" placeholder="Pierre" />
              </UFormField>
              <UFormField label="Nom" :error="errors.partnerLastName" required>
                <UInput v-model="form.partnerLastName" placeholder="Martin" />
              </UFormField>
              <UFormField label="Club">
                <UInput v-model="form.partnerClub" />
              </UFormField>
              <UFormField label="N° Licence">
                <UInput v-model="form.partnerLicenceNumber" />
              </UFormField>
              <UFormField label="Points FFTT">
                <UInput
                  v-model.number="form.partnerRanking"
                  type="number"
                  min="0"
                />
              </UFormField>
            </div>
          </div>
        </template>

        <div class="flex justify-end gap-2 pt-2">
          <UButton
            variant="ghost"
            color="neutral"
            @click="$emit('update:open', false)"
          >
            Annuler
          </UButton>
          <UButton :loading="saving" @click="save"> Inscrire </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
