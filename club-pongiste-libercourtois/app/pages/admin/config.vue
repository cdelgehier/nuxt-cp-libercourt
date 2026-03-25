<template>
  <div class="space-y-6">
    <div
      class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
    >
      <h2 class="text-base font-semibold text-gray-900 dark:text-white mb-6">
        Informations du club
      </h2>

      <div v-if="pending" class="p-8 text-center text-gray-400">
        Chargement...
      </div>

      <form v-else class="space-y-6" @submit.prevent="save">
        <!-- Identité -->
        <fieldset class="space-y-4">
          <legend
            class="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3"
          >
            Identité
          </legend>
          <div class="grid grid-cols-2 gap-4">
            <UFormGroup label="Nom du club" name="name" class="col-span-2">
              <UInput v-model="form.name" />
            </UFormGroup>
            <UFormGroup label="ID FFTT" name="clubId">
              <UInput v-model="form.clubId" />
            </UFormGroup>
            <UFormGroup label="Email" name="email">
              <UInput v-model="form.email" type="email" />
            </UFormGroup>
            <UFormGroup label="Téléphone" name="phone">
              <UInput v-model="form.phone" />
            </UFormGroup>
            <UFormGroup label="Site web" name="website">
              <UInput v-model="form.website" />
            </UFormGroup>
            <UFormGroup
              label="Page Facebook"
              name="facebookUrl"
              class="col-span-2"
            >
              <UInput v-model="form.facebookUrl" />
            </UFormGroup>
          </div>
        </fieldset>

        <!-- Localisation -->
        <fieldset class="space-y-4">
          <legend
            class="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3"
          >
            Localisation
          </legend>
          <div class="grid grid-cols-2 gap-4">
            <UFormGroup label="Salle" name="salle" class="col-span-2">
              <UInput v-model="form.salle" placeholder="Salle omnisports" />
            </UFormGroup>
            <UFormGroup label="Complexe" name="complexe" class="col-span-2">
              <UInput v-model="form.complexe" />
            </UFormGroup>
            <UFormGroup label="Adresse" name="street" class="col-span-2">
              <UInput v-model="form.street" />
            </UFormGroup>
            <UFormGroup label="Code postal" name="postalCode">
              <UInput v-model="form.postalCode" />
            </UFormGroup>
            <UFormGroup label="Ville" name="city">
              <UInput v-model="form.city" />
            </UFormGroup>
            <UFormGroup label="Latitude" name="lat">
              <UInput v-model="form.lat" />
            </UFormGroup>
            <UFormGroup label="Longitude" name="lng">
              <UInput v-model="form.lng" />
            </UFormGroup>
            <UFormGroup
              label="URL Google Maps"
              name="googleMapsUrl"
              class="col-span-2"
            >
              <UInput v-model="form.googleMapsUrl" />
            </UFormGroup>
          </div>
        </fieldset>

        <div class="flex justify-end">
          <UButton type="submit" :loading="saving" icon="i-heroicons-check">
            Enregistrer
          </UButton>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: "AdminConfigPage" });
definePageMeta({ layout: "admin", middleware: "admin" });
useSeoMeta({ title: "Admin — Configuration", robots: "noindex,nofollow" });

const toast = useToast();

const { data: config, pending } = await useFetch("/api/club/config");

const form = reactive({
  name: "",
  clubId: "",
  email: "",
  phone: "",
  website: "",
  facebookUrl: "",
  salle: "",
  complexe: "",
  street: "",
  postalCode: "",
  city: "",
  lat: "",
  lng: "",
  googleMapsUrl: "",
});

// Pré-remplir le formulaire quand les données arrivent
watch(
  () => config.value,
  (val) => {
    if (!val) return;
    const c = val;
    Object.assign(form, {
      name: c.name ?? "",
      clubId: c.clubId ?? "",
      email: c.email ?? "",
      phone: c.phone ?? "",
      website: c.website ?? "",
      facebookUrl: c.facebookUrl ?? "",
      salle: c.salle ?? "",
      complexe: c.complexe ?? "",
      street: c.street ?? "",
      postalCode: c.postalCode ?? "",
      city: c.city ?? "",
      lat: c.lat ?? "",
      lng: c.lng ?? "",
      googleMapsUrl: c.googleMapsUrl ?? "",
    });
  },
  { immediate: true },
);

const saving = ref(false);

async function save() {
  saving.value = true;
  try {
    await $fetch("/api/admin/config", { method: "PUT", body: form });
    toast.add({ title: "Configuration enregistrée", color: "green" });
  } catch {
    toast.add({ title: "Erreur lors de la sauvegarde", color: "red" });
  } finally {
    saving.value = false;
  }
}
</script>
