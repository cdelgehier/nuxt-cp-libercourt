<script setup lang="ts">
import { z } from "zod";
import type { TournamentWithSeries } from "~~/server/domains/tournament/types";

definePageMeta({ layout: "ja" });

const route = useRoute();
const slug = route.params.slug as string;
const redirect = (route.query.redirect as string) || `/tournois/${slug}/ja`;

const { data: tournament } = await useFetch<TournamentWithSeries>(
  `/api/tournois/${slug}`,
);

useSeoMeta({ title: "Connexion Juge Arbitre" });

const form = reactive({ jaAccessId: undefined as number | undefined, pin: "" });
const errors = reactive<Record<string, string>>({});
const loading = ref(false);
const toast = useToast();

const schema = z.object({
  jaAccessId: z.number({ message: "Sélectionnez un accès" }).positive(),
  pin: z.string().min(1, "Saisissez votre code PIN"),
});

// Public endpoint — returns only {id, name} for active accesses (no PIN exposed)
const { data: jaAccesses } = await useFetch<{ id: number; name: string }[]>(
  `/api/tournois/${slug}/ja-accesses`,
);

const accessOptions = computed(() =>
  (jaAccesses.value ?? []).map((a) => ({ label: a.name, value: a.id })),
);

async function login() {
  const result = schema.safeParse(form);
  if (!result.success) {
    result.error.issues.forEach((i) => {
      errors[String(i.path[0])] = i.message;
    });
    return;
  }
  Object.keys(errors).forEach((k) => Reflect.deleteProperty(errors, k));
  loading.value = true;
  try {
    await $fetch("/api/ja/auth", {
      method: "POST",
      body: { jaAccessId: form.jaAccessId, pin: form.pin },
    });
    await navigateTo(redirect);
  } catch {
    toast.add({ title: "Code incorrect ou accès désactivé", color: "error" });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <UCard class="w-full max-w-md">
      <template #header>
        <div class="text-center">
          <UIcon
            name="i-heroicons-clipboard-document-check"
            class="w-10 h-10 text-primary-500 mx-auto mb-2"
          />
          <h1 class="text-xl font-bold text-club-navy">
            Interface Juge Arbitre
          </h1>
          <p v-if="tournament" class="text-sm text-gray-500 mt-1">
            {{ tournament.name }}
          </p>
        </div>
      </template>

      <form class="space-y-4" @submit.prevent="login">
        <UFormField label="Votre accès" :error="errors.jaAccessId" required>
          <USelect
            v-model="form.jaAccessId"
            :items="accessOptions"
            placeholder="Sélectionnez votre nom"
          />
        </UFormField>

        <UFormField label="Code PIN" :error="errors.pin" required>
          <UInput
            v-model="form.pin"
            type="password"
            inputmode="numeric"
            pattern="[0-9]*"
            placeholder="••••"
            class="font-mono"
            autocomplete="current-password"
          />
        </UFormField>

        <UButton type="submit" block :loading="loading"> Se connecter </UButton>
      </form>
    </UCard>
  </div>
</template>
