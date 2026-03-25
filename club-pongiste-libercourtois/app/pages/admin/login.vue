<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4"
  >
    <div class="w-full max-w-sm space-y-6">
      <div class="text-center">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Accès administration
        </h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Club Pongiste Libercourtois
        </p>
      </div>

      <!-- SSO Authentik -->
      <div
        class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4"
      >
        <p class="text-sm font-medium text-gray-700 dark:text-gray-300">
          Connexion via SSO
        </p>
        <UButton
          block
          icon="i-heroicons-arrow-right-on-rectangle"
          @click="loginWithSSO"
        >
          Se connecter avec Authentik
        </UButton>
      </div>

      <!-- Séparateur -->
      <div class="flex items-center gap-3">
        <div class="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        <span class="text-xs text-gray-400">ou</span>
        <div class="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
      </div>

      <!-- Fallback mot de passe -->
      <div
        class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4"
      >
        <p class="text-sm font-medium text-gray-700 dark:text-gray-300">
          Mot de passe admin
          <span class="ml-1 text-xs text-gray-400 font-normal"
            >(si SSO indisponible)</span
          >
        </p>

        <form class="space-y-3" @submit.prevent="submitPassword">
          <UFormGroup label="Mot de passe" name="password" :error="error">
            <UInput
              v-model="password"
              type="password"
              placeholder="••••••••"
              autocomplete="current-password"
            />
          </UFormGroup>

          <UButton type="submit" block variant="outline" :loading="loading">
            Se connecter
          </UButton>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false, middleware: [] });
useSeoMeta({ title: "Connexion — Admin", robots: "noindex,nofollow" });

const route = useRoute();
const redirectTarget = computed(() =>
  encodeURIComponent((route.query.redirect as string) || "/admin"),
);

function loginWithSSO() {
  // Navigation HTTP complète — /auth/oidc/login est une route serveur nuxt-oidc-auth
  window.location.href = "/auth/oidc/login";
}

const password = ref("");
const loading = ref(false);
const error = ref("");

async function submitPassword() {
  error.value = "";
  loading.value = true;
  try {
    await $fetch("/api/auth/basic-login", {
      method: "POST",
      body: { password: password.value },
    });
    await navigateTo((route.query.redirect as string) || "/admin");
  } catch (e: unknown) {
    const msg = (e as { data?: { message?: string } })?.data?.message;
    error.value = msg ?? "Mot de passe incorrect";
  } finally {
    loading.value = false;
  }
}
</script>
