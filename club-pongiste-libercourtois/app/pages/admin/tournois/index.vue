<script setup lang="ts">
  import {
    createTournamentInputSchema,
    type EnrichedTournament
  } from '~~/server/domains/tournament/types'

  definePageMeta({ layout: 'admin', middleware: 'admin' })
  useSeoMeta({ title: 'Admin — Tournois', robots: 'noindex,nofollow' })

  const toast = useToast()
  const {
    data: tournaments,
    pending,
    refresh
  } = await useFetch<EnrichedTournament[]>('/api/admin/tournois')

  const publishedCount = computed(function () {
    return (
      tournaments.value?.filter(function (tournament) {
        return tournament.isPublished
      }).length ?? 0
    )
  })
  const seriesCount = computed(function () {
    return (
      tournaments.value?.reduce(function (total, tournament) {
        return total + tournament.seriesCount
      }, 0) ?? 0
    )
  })

  const modalOpen = ref(false)
  const saving = ref(false)

  const DEFAULT_FORM = {
    name: '',
    date: '',
    dateEnd: '',
    location: 'Complexe Sportif Léo Lagrange, Libercourt',
    locationLat: 50.48185408012125,
    locationLng: 3.017099247377654,
    description: '',
    tableCount: 1,
    isPublished: false
  } as const

  const form = reactive({ ...DEFAULT_FORM })

  const errors = reactive<Record<string, string>>({})

  const schema = createTournamentInputSchema

  function resetForm() {
    Object.assign(form, DEFAULT_FORM)
    Object.keys(errors).forEach(k => Reflect.deleteProperty(errors, k))
  }

  function closeCreateModal() {
    modalOpen.value = false
    resetForm()
  }

  async function create() {
    const result = schema.safeParse(form)
    if (!result.success) {
      result.error.issues.forEach(i => {
        errors[String(i.path[0])] = i.message
      })
      return
    }
    Object.keys(errors).forEach(k => Reflect.deleteProperty(errors, k))
    saving.value = true
    try {
      await $fetch('/api/admin/tournois', { method: 'POST', body: form })
      toast.add({ title: 'Tournoi créé', color: 'success' })
      await refresh()
      modalOpen.value = false
      resetForm()
    } catch (e: unknown) {
      const msg =
        (e as { data?: { message?: string } })?.data?.message ?? 'Erreur'
      toast.add({ title: msg, color: 'error' })
    } finally {
      saving.value = false
    }
  }

  function formatDate(t: EnrichedTournament) {
    return formatDateRange(t.date, t.dateEnd)
  }

  async function deleteTournament(t: EnrichedTournament) {
    if (
      !confirm(
        `Supprimer "${t.name}" et toutes ses séries/inscriptions/matchs ?`
      )
    )
      return
    try {
      await $fetch(`/api/admin/tournois/${t.slug}`, { method: 'DELETE' })
      toast.add({ title: 'Tournoi supprimé', color: 'success' })
      await refresh()
    } catch (e: unknown) {
      const msg =
        (e as { data?: { message?: string } })?.data?.message ?? 'Erreur'
      toast.add({ title: msg, color: 'error' })
    }
  }
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p
          class="text-xs font-semibold uppercase tracking-widest text-slate-500"
        >
          Organisation
        </p>
        <h1 class="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
          Tournois
        </h1>
        <p class="mt-2 text-sm text-slate-500">
          Préparez les séries, accueillez les joueurs et suivez la compétition.
        </p>
      </div>
      <UButton icon="i-heroicons-plus" @click="modalOpen = true"
        >Nouveau tournoi</UButton
      >
    </div>
    <div
      class="flex flex-wrap gap-6 rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-500"
    >
      <span
        ><strong class="mr-1 text-slate-900">{{
          tournaments?.length ?? 0
        }}</strong>
        tournois</span
      >
      <span
        ><strong class="mr-1 text-slate-900">{{ publishedCount }}</strong>
        publiés</span
      >
      <span
        ><strong class="mr-1 text-slate-900">{{ seriesCount }}</strong>
        séries</span
      >
    </div>
    <div
      v-if="pending"
      class="rounded-2xl bg-white p-12 text-center text-slate-500"
    >
      Chargement des tournois…
    </div>
    <div
      v-else-if="!tournaments?.length"
      class="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center"
    >
      <UIcon name="i-heroicons-trophy" class="size-10 text-slate-300" />
      <h2 class="mt-4 text-lg font-semibold text-slate-900">
        Organisez votre premier tournoi
      </h2>
      <p class="mt-2 text-sm text-slate-500">
        Commencez par la date et le lieu. Vous ajouterez ensuite les séries.
      </p>
      <UButton class="mt-5" icon="i-heroicons-plus" @click="modalOpen = true"
        >Nouveau tournoi</UButton
      >
    </div>
    <div v-else class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="t in tournaments"
        :key="t.id"
        class="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
      >
        <div class="flex items-center justify-between">
          <div
            class="flex size-11 items-center justify-center rounded-xl bg-slate-100"
          >
            <UIcon name="i-heroicons-trophy" class="size-6 text-slate-700" />
          </div>
          <UBadge
            :color="t.isPublished ? 'success' : 'neutral'"
            variant="subtle"
            >{{ t.isPublished ? 'Publié' : 'Brouillon' }}</UBadge
          >
        </div>
        <h2 class="mt-5 text-xl font-semibold text-slate-900">
          <NuxtLink :to="`/admin/tournois/${t.slug}`" class="hover:underline">{{
            t.name
          }}</NuxtLink>
        </h2>
        <div class="mt-3 space-y-2 text-sm text-slate-500">
          <p class="flex items-start gap-2">
            <UIcon
              name="i-heroicons-calendar-days"
              class="mt-0.5 size-4 shrink-0"
            />{{ formatDate(t) }}
          </p>
          <p v-if="t.location" class="flex items-start gap-2">
            <UIcon
              name="i-heroicons-map-pin"
              class="mt-0.5 size-4 shrink-0"
            />{{ t.location }}
          </p>
          <p class="flex items-center gap-2">
            <UIcon name="i-heroicons-squares-2x2" class="size-4" />{{
              t.seriesCount
            }}
            séries · {{ t.tableCount }} tables
          </p>
        </div>
        <div class="mt-auto pt-6">
          <div
            class="flex items-center justify-between border-t border-slate-100 pt-4"
          >
            <UButton
              :to="`/admin/tournois/${t.slug}`"
              color="neutral"
              variant="outline"
              trailing-icon="i-heroicons-arrow-right"
              >Gérer le tournoi</UButton
            ><UButton
              size="sm"
              variant="ghost"
              color="error"
              icon="i-heroicons-trash"
              :aria-label="`Supprimer le tournoi ${t.name}`"
              @click="deleteTournament(t)"
            />
          </div>
        </div>
      </article>
    </div>

    <!-- Create modal -->
    <UModal
      v-model:open="modalOpen"
      title="Nouveau tournoi"
      description="Les informations pratiques de votre compétition."
      :ui="{ content: 'max-w-xl rounded-2xl' }"
    >
      <template #body>
        <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <UFormField
            class="sm:col-span-2"
            label="Nom"
            :error="errors.name"
            required
          >
            <UInput
              v-model="form.name"
              class="w-full"
              placeholder="Open Libercourtois 2026"
            />
          </UFormField>
          <UFormField label="Date de début" :error="errors.date" required>
            <UInput v-model="form.date" class="w-full" type="date" />
          </UFormField>
          <UFormField
            label="Date de fin (tournoi multi-jours)"
            :error="errors.dateEnd"
          >
            <UInput
              v-model="form.dateEnd"
              class="w-full"
              type="date"
              :min="form.date"
            />
          </UFormField>
          <UFormField class="sm:col-span-2" label="Lieu">
            <UInput
              v-model="form.location"
              class="w-full"
              placeholder="Salle des fêtes"
            />
          </UFormField>
          <UFormField label="Nombre de tables" :error="errors.tableCount">
            <UInput
              v-model.number="form.tableCount"
              class="w-full"
              type="number"
              min="1"
              max="100"
            />
          </UFormField>
          <UFormField class="sm:col-span-2" label="Description">
            <UTextarea v-model="form.description" class="w-full" :rows="3" />
          </UFormField>
          <UFormField label="Publier immédiatement">
            <USwitch v-model="form.isPublished" />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton variant="ghost" color="neutral" @click="closeCreateModal"
            >Annuler</UButton
          >
          <UButton :loading="saving" @click="create">Créer</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
