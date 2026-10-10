<script setup lang="ts">
  import {
    updateTournamentInputSchema,
    type TournamentWithSeries,
    type TournamentJaAccess,
    type TournamentSeries,
    type SeriesRegistration,
    type SeriesWithBracket
  } from '~~/server/domains/tournament/types'

  definePageMeta({ layout: 'admin', middleware: 'admin' })

  const route = useRoute()
  const slug = route.params.slug as string
  const toast = useToast()

  const { data: tournament, refresh: refreshTournament } =
    await useFetch<TournamentWithSeries>(`/api/admin/tournois/${slug}`)

  useSeoMeta({
    title: computed(() =>
      tournament.value ? `Admin — ${tournament.value.name}` : 'Admin — Tournoi'
    ),
    robots: 'noindex,nofollow'
  })

  // ---------------------------------------------------------------------------
  // Tabs
  // ---------------------------------------------------------------------------
  const tabs = [
    { label: 'Général', value: 'general', icon: 'i-heroicons-cog-6-tooth' },
    { label: 'Accès JA', value: 'ja', icon: 'i-heroicons-key' },
    { label: 'Séries', value: 'series', icon: 'i-heroicons-squares-2x2' }
  ]
  const activeTab = ref('series')

  // ---------------------------------------------------------------------------
  // Tab Général — edit tournament
  // ---------------------------------------------------------------------------
  const editForm = reactive({
    name: '',
    date: '',
    dateEnd: '',
    location: '',
    locationLat: undefined as number | undefined,
    locationLng: undefined as number | undefined,
    description: '',
    tableCount: 1,
    isPublished: false
  })
  const editErrors = reactive<Record<string, string>>({})
  const editSaving = ref(false)

  watch(
    () => tournament.value,
    t => {
      if (!t) return
      Object.assign(editForm, {
        name: t.name,
        date: t.date,
        dateEnd: t.dateEnd ?? '',
        location: t.location ?? '',
        locationLat: t.locationLat ?? undefined,
        locationLng: t.locationLng ?? undefined,
        description: t.description ?? '',
        tableCount: t.tableCount,
        isPublished: t.isPublished
      })
    },
    { immediate: true }
  )

  const editSchema = updateTournamentInputSchema

  async function saveGeneral() {
    const result = editSchema.safeParse(editForm)
    if (!result.success) {
      result.error.issues.forEach(i => {
        editErrors[String(i.path[0])] = i.message
      })
      return
    }
    Object.keys(editErrors).forEach(k => Reflect.deleteProperty(editErrors, k))
    editSaving.value = true
    try {
      await $fetch(`/api/admin/tournois/${slug}`, {
        method: 'PATCH',
        body: editForm
      })
      toast.add({ title: 'Tournoi mis à jour', color: 'success' })
      await refreshTournament()
    } catch {
      toast.add({ title: 'Erreur', color: 'error' })
    } finally {
      editSaving.value = false
    }
  }

  async function deleteTournament() {
    if (!confirm('Supprimer ce tournoi ? Cette action est irréversible.'))
      return
    try {
      await $fetch(`/api/admin/tournois/${slug}`, { method: 'DELETE' })
      await navigateTo('/admin/tournois')
    } catch {
      toast.add({ title: 'Erreur de suppression', color: 'error' })
    }
  }

  // ---------------------------------------------------------------------------
  // Tab JA Access
  // ---------------------------------------------------------------------------
  const { data: jaAccesses, refresh: refreshJa } = await useFetch<
    TournamentJaAccess[]
  >(`/api/admin/tournois/${slug}/ja-access`)

  // ---------------------------------------------------------------------------
  // Tab Séries
  // ---------------------------------------------------------------------------
  const selectedSeriesId = ref<number | null>(null)
  const seriesTab = ref<'registrations' | 'bracket'>('registrations')
  const seriesDetail = ref<SeriesWithBracket | null>(null)
  const loadingSeriesDetail = ref(false)
  const registrations = ref<SeriesRegistration[]>([])

  async function loadSeriesDetail(id: number) {
    loadingSeriesDetail.value = true
    try {
      const detail = await $fetch<SeriesWithBracket>(
        `/api/admin/tournois/${slug}/series/${id}`
      )
      const entries = await $fetch<SeriesRegistration[]>(
        `/api/admin/tournois/${slug}/series/${id}/registrations`
      )
      if (selectedSeriesId.value !== id) return
      seriesDetail.value = detail
      registrations.value = entries
    } catch {
      if (selectedSeriesId.value === id)
        toast.add({
          title: 'Chargement de la série impossible',
          color: 'error'
        })
    } finally {
      if (selectedSeriesId.value === id) loadingSeriesDetail.value = false
    }
  }

  watch(selectedSeriesId, id => {
    seriesTab.value = 'registrations'
    seriesDetail.value = null
    registrations.value = []
    if (id) loadSeriesDetail(id)
  })
  watch(
    () => tournament.value?.series,
    list => {
      if (list && list.length > 0 && !selectedSeriesId.value) {
        selectedSeriesId.value = list[0]!.id
      }
    },
    { immediate: true }
  )

  const activeParticipantCount = computed(function () {
    return registrations.value.filter(function (registration) {
      return (
        registration.attendanceStatus === 'present' && !registration.isForfeit
      )
    }).length
  })

  // Edit series modal
  const editSeriesModalOpen = ref(false)
  const editSeriesSaving = ref(false)
  const editSeriesForm = reactive({
    name: '',
    seriesFormat: 'singles' as 'singles' | 'doubles',
    seriesType: 'standard' as string,
    ageCategories: [] as string[],
    femalesOnly: false,
    pointsLimitMin: undefined as number | undefined,
    pointsLimitMax: undefined as number | undefined,
    maxPlayers: undefined as number | undefined,
    setsToWin: 3,
    pointsPerSet: 11,
    seriesDate: '',
    startTime: ''
  })

  watch(
    () => editSeriesForm.seriesType,
    function (type, old) {
      if (!editSeriesModalOpen.value || type === old) return
      if (type === 'speedy') {
        editSeriesForm.pointsPerSet = 3
        editSeriesForm.setsToWin = 1
      }
    },
    { flush: 'sync' }
  )
  function openEditSeries() {
    const s = currentSeries.value
    if (!s) return
    Object.assign(editSeriesForm, {
      name: s.name,
      seriesFormat: s.seriesFormat,
      seriesType: s.seriesType,
      ageCategories: [...(s.ageCategories ?? [])],
      femalesOnly: s.femalesOnly,
      pointsLimitMin: s.pointsLimitMin ?? undefined,
      pointsLimitMax: s.pointsLimitMax ?? undefined,
      maxPlayers: s.maxPlayers ?? undefined,
      setsToWin: s.setsToWin,
      pointsPerSet: s.pointsPerSet,
      seriesDate: s.seriesDate ?? '',
      startTime: s.startTime ?? ''
    })
    editSeriesModalOpen.value = true
  }

  async function saveEditSeries() {
    if (!selectedSeriesId.value) return
    editSeriesSaving.value = true
    try {
      await $fetch(
        `/api/admin/tournois/${slug}/series/${selectedSeriesId.value}`,
        {
          method: 'PATCH',
          body: editSeriesForm
        }
      )
      toast.add({ title: 'Série mise à jour', color: 'success' })
      await refreshTournament()
      editSeriesModalOpen.value = false
    } catch (e: unknown) {
      const raw = (e as { data?: { message?: string } })?.data?.message
      const msg =
        raw && raw.startsWith('[') ? 'Vérifiez les champs' : (raw ?? 'Erreur')
      toast.add({ title: msg, color: 'error' })
    } finally {
      editSeriesSaving.value = false
    }
  }

  // Create series modal
  const seriesModalOpen = ref(false)
  const seriesSaving = ref(false)
  const seriesForm = reactive({
    name: '',
    seriesFormat: 'singles' as 'singles' | 'doubles',
    seriesType: 'standard' as string,
    ageCategories: [] as string[],
    femalesOnly: false,
    pointsLimitMin: undefined as number | undefined,
    pointsLimitMax: undefined as number | undefined,
    maxPlayers: undefined as number | undefined,
    setsToWin: 3,
    pointsPerSet: 11,
    seriesDate: '',
    startTime: ''
  })
  async function createSeries() {
    if (!seriesForm.name || seriesForm.name.trim().length < 2) {
      toast.add({
        title: 'Le nom de la série est requis (2 caractères minimum)',
        color: 'error'
      })
      return
    }
    seriesSaving.value = true
    try {
      const created = await $fetch<TournamentSeries>(
        `/api/admin/tournois/${slug}/series`,
        {
          method: 'POST',
          body: seriesForm
        }
      )
      toast.add({ title: 'Série créée', color: 'success' })
      await refreshTournament()
      selectedSeriesId.value = created.id
      seriesModalOpen.value = false
    } catch (e: unknown) {
      const raw = (e as { data?: { message?: string } })?.data?.message
      // Zod errors come as JSON array — show a simple message instead
      const msg =
        raw && raw.startsWith('[')
          ? 'Vérifiez les champs du formulaire'
          : (raw ?? 'Erreur')
      toast.add({ title: msg, color: 'error' })
    } finally {
      seriesSaving.value = false
    }
  }

  watch(
    () => seriesForm.seriesType,
    function (type) {
      if (type === 'speedy') {
        seriesForm.pointsPerSet = 3
        seriesForm.setsToWin = 1
      }
    }
  )
  async function generateBracket() {
    if (!selectedSeriesId.value) return
    if (
      !confirm(
        'Générer les poules ?\n\nLes inscriptions seront fermées — utilisez "Annuler les poules" pour les rouvrir si nécessaire.'
      )
    )
      return
    try {
      const current = await $fetch<{ version: number }>(
        `/api/admin/tournois/${slug}/series/${selectedSeriesId.value}/integral`
      )
      await $fetch(
        `/api/admin/tournois/${slug}/series/${selectedSeriesId.value}/integral`,
        {
          method: 'POST',
          body: { action: 'generate', version: current.version }
        }
      )
      toast.add({ title: 'Poules générées', color: 'success' })
      await loadSeriesDetail(selectedSeriesId.value)
      await refreshTournament()
      seriesTab.value = 'bracket'
    } catch (e: unknown) {
      const msg =
        (e as { data?: { message?: string } })?.data?.message ?? 'Erreur'
      toast.add({ title: msg, color: 'error' })
    }
  }

  const isDev = import.meta.dev
  const addRegistrationOpen = ref(false)
  const seeding = ref(false)
  const demoCount = ref(24)

  async function devSeedSeries(count = 24) {
    if (!selectedSeriesId.value) return
    seeding.value = true
    try {
      const res = await $fetch<{ inserted: number }>(
        `/api/admin/tournois/${slug}/series/${selectedSeriesId.value}/demo`,
        {
          method: 'POST',
          body: { count }
        }
      )
      toast.add({
        title: `${res.inserted} ${currentSeries.value?.seriesFormat === 'doubles' ? 'paires fictives ajoutées' : 'joueurs fictifs ajoutés'}`,
        color: 'success'
      })
      await refreshSeriesState()
    } catch (error: unknown) {
      const message = (error as { data?: { message?: string } })?.data?.message
      toast.add({ title: message ?? 'Remplissage impossible', color: 'error' })
    } finally {
      seeding.value = false
    }
  }
  const currentSeries = computed<TournamentSeries | undefined>(() =>
    tournament.value?.series.find(s => s.id === selectedSeriesId.value)
  )

  async function refreshSeriesState(): Promise<void> {
    await refreshTournament()
    await refreshRegistrations()
  }

  async function refreshRegistrations() {
    const id = selectedSeriesId.value
    if (!id) return
    const entries = await $fetch<SeriesRegistration[]>(
      `/api/admin/tournois/${slug}/series/${id}/registrations`
    )
    if (selectedSeriesId.value === id) registrations.value = entries
  }

  async function deleteSeries() {
    if (!selectedSeriesId.value || !currentSeries.value) return
    if (
      !confirm(
        `Supprimer la série "${currentSeries.value.name}" ? Toutes les inscriptions et matchs seront supprimés.`
      )
    )
      return
    try {
      await $fetch(
        `/api/admin/tournois/${slug}/series/${selectedSeriesId.value}`,
        { method: 'DELETE' }
      )
      selectedSeriesId.value = null
      await refreshTournament()
    } catch (e: unknown) {
      const msg =
        (e as { data?: { message?: string } })?.data?.message ?? 'Erreur'
      toast.add({ title: msg, color: 'error' })
    }
  }
</script>

<template>
  <div v-if="tournament" class="mx-auto max-w-7xl space-y-6">
    <section
      class="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-sm"
    >
      <NuxtLink
        to="/admin/tournois"
        class="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900"
      >
        <UIcon name="i-heroicons-arrow-left" class="size-4" /> Tous les tournois
      </NuxtLink>
      <div class="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div class="flex items-center gap-3">
            <h1
              class="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900"
            >
              {{ tournament.name }}
            </h1>
            <UBadge
              :color="tournament.isPublished ? 'success' : 'neutral'"
              variant="subtle"
              >{{ tournament.isPublished ? 'Publié' : 'Brouillon' }}</UBadge
            >
          </div>
          <div
            class="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500"
          >
            <span class="inline-flex items-center gap-1.5"
              ><UIcon name="i-heroicons-calendar-days" class="size-4" />{{
                formatDateRange(tournament.date, tournament.dateEnd)
              }}</span
            >
            <span class="inline-flex items-center gap-1.5"
              ><UIcon name="i-heroicons-table-cells" class="size-4" />{{
                tournament.tableCount
              }}
              tables</span
            >
            <span class="inline-flex items-center gap-1.5"
              ><UIcon name="i-heroicons-squares-2x2" class="size-4" />{{
                tournament.series.length
              }}
              séries</span
            >
          </div>
        </div>
        <UButton
          :to="`/tournois/${slug}/ja`"
          target="_blank"
          color="neutral"
          variant="outline"
          icon="i-heroicons-arrow-top-right-on-square"
          >Ouvrir le poste JA</UButton
        >
      </div>
    </section>
    <UTabs
      v-model="activeTab"
      :items="tabs"
      :content="false"
      variant="link"
      color="neutral"
      :ui="{
        list: 'w-full justify-start border-b border-slate-200',
        trigger: 'flex-none px-4 py-3',
        indicator: 'bg-club-green'
      }"
    />

    <!-- Tab: Général -->
    <div
      v-if="activeTab === 'general'"
      class="grid grid-cols-1 gap-5 rounded-2xl border border-slate-200 bg-white p-6 sm:grid-cols-2 max-w-3xl"
    >
      <UFormField label="Nom" :error="editErrors.name" required>
        <UInput v-model="editForm.name" class="w-full" />
      </UFormField>
      <UFormField label="Date de début" :error="editErrors.date" required>
        <UInput v-model="editForm.date" class="w-full" type="date" />
      </UFormField>
      <UFormField label="Date de fin (multi-jours)" :error="editErrors.dateEnd">
        <UInput
          v-model="editForm.dateEnd"
          class="w-full"
          type="date"
          :min="editForm.date"
        />
      </UFormField>
      <UFormField label="Lieu">
        <UInput v-model="editForm.location" class="w-full" />
      </UFormField>
      <UFormField label="Nombre de tables" :error="editErrors.tableCount">
        <UInput
          v-model.number="editForm.tableCount"
          class="w-full"
          type="number"
          min="1"
          max="100"
        />
      </UFormField>
      <UFormField label="Description">
        <UTextarea v-model="editForm.description" class="w-full" :rows="3" />
      </UFormField>
      <UFormField label="Publié">
        <USwitch v-model="editForm.isPublished" />
      </UFormField>
      <div class="flex flex-wrap gap-2 pt-2 sm:col-span-2">
        <UButton :loading="editSaving" @click="saveGeneral"
          >Enregistrer</UButton
        >
        <UButton variant="ghost" color="error" @click="deleteTournament"
          >Supprimer le tournoi</UButton
        >
      </div>
    </div>

    <!-- Tab: JA Access -->
    <div v-if="activeTab === 'ja'">
      <TournamentJaAccessManager
        :accesses="jaAccesses ?? []"
        :slug="slug"
        :tournament-id="tournament.id"
        @refresh="refreshJa"
      />
    </div>

    <!-- Tab: Séries -->
    <div v-if="activeTab === 'series'" class="space-y-4">
      <div class="flex items-center justify-between gap-4">
        <div>
          <h2 class="text-lg font-semibold text-slate-900">
            Séries du tournoi
          </h2>
          <p class="text-sm text-slate-500">
            Inscriptions, pointage et progression sportive.
          </p>
        </div>
        <UButton icon="i-heroicons-plus" @click="seriesModalOpen = true">
          Nouvelle série
        </UButton>
      </div>
      <TournamentSeriesSelector
        :series="tournament.series"
        :model-value="selectedSeriesId"
        @update:model-value="selectedSeriesId = $event"
      />
      <div
        v-if="!tournament.series.length"
        class="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"
      >
        <UIcon name="i-heroicons-squares-plus" class="size-9 text-slate-400" />
        <h3 class="mt-3 font-semibold text-slate-900">Votre première série</h3>
        <p class="mt-1 text-sm text-slate-500">
          Choisissez le format et les règles, puis inscrivez les participants.
        </p>
        <UButton
          class="mt-5"
          icon="i-heroicons-plus"
          @click="seriesModalOpen = true"
          >Créer une série</UButton
        >
      </div>

      <!-- Series detail -->
      <div
        v-if="loadingSeriesDetail"
        class="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500"
        role="status"
      >
        Chargement de la série…
      </div>
      <template v-else-if="currentSeries && seriesDetail">
        <section
          class="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm"
        >
          <div class="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 class="mb-2 text-xl font-semibold text-slate-900">
                {{ currentSeries.name }}
              </h2>
              <div class="flex items-center gap-2 flex-wrap">
                <TournamentSeriesStatusBadge :status="currentSeries.status" />
                <TournamentSeriesTypeBadge
                  :type="currentSeries.seriesType"
                  :points-limit-min="currentSeries.pointsLimitMin"
                  :points-limit-max="currentSeries.pointsLimitMax"
                />
                <UBadge
                  v-if="currentSeries.femalesOnly"
                  color="neutral"
                  variant="solid"
                  size="sm"
                >
                  ♀ Féminines
                </UBadge>
                <span class="text-sm text-gray-500">
                  {{ registrations.length }} inscrit{{
                    registrations.length > 1 ? 's' : ''
                  }}
                </span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <UButton
                size="sm"
                variant="ghost"
                color="neutral"
                icon="i-heroicons-pencil-square"
                @click="openEditSeries"
              >
                Modifier
              </UButton>
              <UButton
                v-if="
                  currentSeries.status === 'draft' ||
                  currentSeries.status === 'registration'
                "
                size="sm"
                variant="ghost"
                color="error"
                icon="i-heroicons-trash"
                @click="deleteSeries"
              >
                Supprimer
              </UButton>
            </div>
          </div>

          <!-- Sub-tabs: Inscriptions / Tableau -->
          <div class="mt-5 mb-5 flex gap-2 border-t border-slate-100 pt-4">
            <UButton
              size="sm"
              :variant="seriesTab === 'registrations' ? 'solid' : 'outline'"
              color="neutral"
              @click="seriesTab = 'registrations'"
            >
              Inscriptions
            </UButton>
            <UButton
              size="sm"
              :variant="seriesTab === 'bracket' ? 'solid' : 'outline'"
              color="neutral"
              :disabled="
                currentSeries.status === 'draft' ||
                currentSeries.status === 'registration'
              "
              @click="seriesTab = 'bracket'"
            >
              Poules et classement
            </UButton>
          </div>

          <!-- Registrations sub-tab -->
          <div v-if="seriesTab === 'registrations'" class="space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <p class="text-sm text-slate-500">
                Suivez la présence et les frais d’inscription.
              </p>
              <div class="flex flex-wrap items-center gap-2">
                <UButton
                  v-if="
                    ['draft', 'registration'].includes(currentSeries.status)
                  "
                  size="sm"
                  icon="i-heroicons-user-plus"
                  @click="addRegistrationOpen = true"
                  >Inscrire un joueur</UButton
                >
                <UButton
                  v-if="
                    ['draft', 'registration'].includes(currentSeries.status)
                  "
                  size="sm"
                  variant="outline"
                  color="neutral"
                  icon="i-heroicons-table-cells"
                  :disabled="activeParticipantCount < 2"
                  @click="generateBracket"
                  >Générer les poules</UButton
                >
              </div>
            </div>
            <div
              v-if="
                isDev &&
                ['draft', 'registration'].includes(currentSeries.status)
              "
              class="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-amber-300 bg-amber-50 p-3"
            >
              <UIcon name="i-heroicons-beaker" class="size-5 text-amber-700" />
              <div class="mr-auto">
                <p class="text-sm font-medium text-amber-900">
                  Démonstration locale
                </p>
                <p class="text-xs text-amber-700">
                  Participants fictifs, tous présents. Base locale uniquement.
                </p>
              </div>
              <UInput
                v-model.number="demoCount"
                type="number"
                min="2"
                max="32"
                aria-label="Nombre de participants fictifs"
                class="w-20"
              />
              <UButton
                color="warning"
                variant="outline"
                size="sm"
                :loading="seeding"
                @click="devSeedSeries(demoCount)"
                >Remplir la série</UButton
              >
            </div>
            <TournamentRegistrationTable
              :roster-locked="
                !!currentSeries &&
                !['draft', 'registration'].includes(currentSeries.status)
              "
              :registrations="registrations"
              :series-format="currentSeries.seriesFormat"
              :slug="slug"
              :series-id="currentSeries.id"
              @refresh="refreshSeriesState"
            />
          </div>

          <!-- Bracket sub-tab -->
          <div v-if="seriesTab === 'bracket'" class="space-y-3">
            <TournamentIntegralBoard
              :key="currentSeries.id"
              :slug="slug"
              :series-id="currentSeries.id"
              api-base="/api/admin/tournois"
              @refresh="refreshSeriesState"
            />
          </div>
        </section>
      </template>
    </div>

    <!-- Add registration modal -->
    <TournamentJaMultiSeriesRegistrationModal
      v-if="tournament"
      :open="addRegistrationOpen"
      :initial-series-id="selectedSeriesId"
      :series="tournament.series"
      :slug="slug"
      api-base="/api/admin/tournois"
      @update:open="addRegistrationOpen = $event"
      @refresh="refreshSeriesState"
    />

    <!-- Edit series modal -->
    <UModal
      v-model:open="editSeriesModalOpen"
      title="Modifier la série"
      description="Format, règles et conditions d’inscription."
      :ui="{ content: 'max-w-2xl rounded-2xl' }"
    >
      <template #body>
        <div class="space-y-5">
          <UFormField label="Nom" required>
            <UInput v-model="editSeriesForm.name" class="w-full" />
          </UFormField>
          <div class="grid grid-cols-2 gap-3">
            <UFormField label="Format">
              <USelect
                v-model="editSeriesForm.seriesFormat"
                class="w-full"
                :items="[
                  { label: 'Simple', value: 'singles' },
                  { label: 'Double', value: 'doubles' }
                ]"
              />
            </UFormField>
            <UFormField label="Type">
              <USelect
                v-model="editSeriesForm.seriesType"
                class="w-full"
                :items="[
                  { label: 'Standard', value: 'standard' },
                  { label: 'Speedy', value: 'speedy' },
                  { label: 'Handicap', value: 'handicap' },
                  { label: 'Pts limités', value: 'points_limit' },
                  { label: 'Double mixte', value: 'mixed_doubles' }
                ]"
              />
            </UFormField>
          </div>
          <UFormField
            label="Catégories d'âge autorisées"
            hint="Aucune sélection : ouvert à tous"
          >
            <div class="flex flex-wrap gap-2 mt-1">
              <label
                v-for="cat in [
                  { value: 'poussin', label: 'Poussin' },
                  { value: 'benjamin', label: 'Benjamin' },
                  { value: 'minimes', label: 'Minimes' },
                  { value: 'cadets', label: 'Cadets' },
                  { value: 'juniors', label: 'Juniors' },
                  { value: 'veterans', label: 'Vétérans' },
                  { value: 'super_veterans', label: 'Super Vétérans' }
                ]"
                :key="cat.value"
                class="flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm cursor-pointer select-none transition-colors"
                :class="
                  editSeriesForm.ageCategories.includes(cat.value)
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-primary-400'
                "
              >
                <input
                  type="checkbox"
                  class="sr-only"
                  :value="cat.value"
                  :checked="editSeriesForm.ageCategories.includes(cat.value)"
                  @change="
                    editSeriesForm.ageCategories.includes(cat.value)
                      ? editSeriesForm.ageCategories.splice(
                          editSeriesForm.ageCategories.indexOf(cat.value),
                          1
                        )
                      : editSeriesForm.ageCategories.push(cat.value)
                  "
                />
                {{ cat.label }}
              </label>
            </div>
          </UFormField>
          <UFormField label="Réservé aux féminines">
            <div class="flex items-center gap-2">
              <USwitch v-model="editSeriesForm.femalesOnly" />
              <span class="text-sm text-gray-500"
                >Seules les joueuses peuvent s'inscrire</span
              >
            </div>
          </UFormField>
          <div
            v-if="editSeriesForm.seriesType === 'points_limit'"
            class="grid grid-cols-2 gap-3"
          >
            <UFormField label="Pts min">
              <UInput
                v-model.number="editSeriesForm.pointsLimitMin"
                class="w-full"
                type="number"
                min="0"
              />
            </UFormField>
            <UFormField label="Pts max">
              <UInput
                v-model.number="editSeriesForm.pointsLimitMax"
                class="w-full"
                type="number"
                min="0"
              />
            </UFormField>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <UFormField label="Manches gagnantes">
              <UInput
                v-model.number="editSeriesForm.setsToWin"
                class="w-full"
                type="number"
                min="1"
                max="4"
              />
            </UFormField>
            <UFormField label="Points par manche">
              <UInput
                v-model.number="editSeriesForm.pointsPerSet"
                class="w-full"
                type="number"
                min="3"
                max="21"
              />
            </UFormField>
          </div>
          <UFormField label="Nombre maximal de participants">
            <UInput
              v-model.number="editSeriesForm.maxPlayers"
              class="w-full"
              type="number"
              min="2"
            />
          </UFormField>
          <div class="grid grid-cols-2 gap-3">
            <UFormField label="Date de la série (optionnel)">
              <UInput
                v-model="editSeriesForm.seriesDate"
                class="w-full"
                type="date"
              />
            </UFormField>
            <UFormField label="Heure de début (optionnel)">
              <UInput
                v-model="editSeriesForm.startTime"
                class="w-full"
                type="time"
              />
            </UFormField>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton
            variant="ghost"
            color="neutral"
            @click="editSeriesModalOpen = false"
            >Annuler</UButton
          >
          <UButton :loading="editSeriesSaving" @click="saveEditSeries"
            >Enregistrer</UButton
          >
        </div>
      </template>
    </UModal>

    <!-- Create series modal -->
    <UModal
      v-model:open="seriesModalOpen"
      title="Nouvelle série"
      description="Format, règles et conditions d’inscription."
      :ui="{ content: 'max-w-2xl rounded-2xl' }"
    >
      <template #body>
        <div class="space-y-5">
          <UFormField label="Nom" required>
            <UInput
              v-model="seriesForm.name"
              class="w-full"
              placeholder="Simple Hommes A"
            />
          </UFormField>
          <div class="grid grid-cols-2 gap-3">
            <UFormField label="Format">
              <USelect
                v-model="seriesForm.seriesFormat"
                class="w-full"
                :items="[
                  { label: 'Simple', value: 'singles' },
                  { label: 'Double', value: 'doubles' }
                ]"
              />
            </UFormField>
            <UFormField label="Type">
              <USelect
                v-model="seriesForm.seriesType"
                class="w-full"
                :items="[
                  { label: 'Standard', value: 'standard' },
                  { label: 'Speedy', value: 'speedy' },
                  { label: 'Handicap', value: 'handicap' },
                  { label: 'Pts limités', value: 'points_limit' },
                  { label: 'Double mixte', value: 'mixed_doubles' }
                ]"
              />
            </UFormField>
          </div>
          <!-- Age categories restriction (optional, multi-select) -->
          <UFormField
            label="Catégories d'âge autorisées"
            hint="Aucune sélection : ouvert à tous"
          >
            <div class="flex flex-wrap gap-2 mt-1">
              <label
                v-for="cat in [
                  { value: 'poussin', label: 'Poussin' },
                  { value: 'benjamin', label: 'Benjamin' },
                  { value: 'minimes', label: 'Minimes' },
                  { value: 'cadets', label: 'Cadets' },
                  { value: 'juniors', label: 'Juniors' },
                  { value: 'veterans', label: 'Vétérans' },
                  { value: 'super_veterans', label: 'Super Vétérans' }
                ]"
                :key="cat.value"
                class="flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm cursor-pointer select-none transition-colors"
                :class="
                  seriesForm.ageCategories.includes(cat.value)
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-primary-400'
                "
              >
                <input
                  type="checkbox"
                  class="sr-only"
                  :value="cat.value"
                  :checked="seriesForm.ageCategories.includes(cat.value)"
                  @change="
                    seriesForm.ageCategories.includes(cat.value)
                      ? seriesForm.ageCategories.splice(
                          seriesForm.ageCategories.indexOf(cat.value),
                          1
                        )
                      : seriesForm.ageCategories.push(cat.value)
                  "
                />
                {{ cat.label }}
              </label>
            </div>
          </UFormField>
          <UFormField label="Réservé aux féminines">
            <div class="flex items-center gap-2">
              <USwitch v-model="seriesForm.femalesOnly" />
              <span class="text-sm text-gray-500"
                >Seules les joueuses peuvent s'inscrire</span
              >
            </div>
          </UFormField>
          <div
            v-if="seriesForm.seriesType === 'points_limit'"
            class="grid grid-cols-2 gap-3"
          >
            <UFormField label="Pts min">
              <UInput
                v-model.number="seriesForm.pointsLimitMin"
                class="w-full"
                type="number"
                min="0"
              />
            </UFormField>
            <UFormField label="Pts max">
              <UInput
                v-model.number="seriesForm.pointsLimitMax"
                class="w-full"
                type="number"
                min="0"
              />
            </UFormField>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <UFormField label="Manches gagnantes">
              <UInput
                v-model.number="seriesForm.setsToWin"
                class="w-full"
                type="number"
                min="1"
                max="4"
              />
            </UFormField>
            <UFormField label="Points par manche">
              <UInput
                v-model.number="seriesForm.pointsPerSet"
                class="w-full"
                type="number"
                min="3"
                max="21"
              />
            </UFormField>
          </div>
          <UFormField label="Nombre maximal de participants">
            <UInput
              v-model.number="seriesForm.maxPlayers"
              class="w-full"
              type="number"
              min="2"
            />
          </UFormField>
          <div class="grid grid-cols-2 gap-3">
            <UFormField label="Date de la série (optionnel)">
              <UInput
                v-model="seriesForm.seriesDate"
                class="w-full"
                type="date"
              />
            </UFormField>
            <UFormField label="Heure de début (optionnel)">
              <UInput
                v-model="seriesForm.startTime"
                class="w-full"
                type="time"
              />
            </UFormField>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton
            variant="ghost"
            color="neutral"
            @click="seriesModalOpen = false"
            >Annuler</UButton
          >
          <UButton :loading="seriesSaving" @click="createSeries">Créer</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
