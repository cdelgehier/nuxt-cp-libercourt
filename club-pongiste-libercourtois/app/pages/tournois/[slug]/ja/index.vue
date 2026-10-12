<script setup lang="ts">
  import type {
    SeriesRegistration,
    TournamentWithSeries
  } from '~~/server/domains/tournament/types'

  definePageMeta({ middleware: 'ja', layout: 'ja' })

  const route = useRoute()
  const slug = route.params.slug as string

  const { data: me } = await useFetch<{
    jaAccessId: number | null
    jaName: string
    tournamentId: number | null
    isAdmin: boolean
  }>('/api/ja/me', { server: false })

  const { data: tournament, refresh: refreshTournament } =
    await useFetch<TournamentWithSeries>(`/api/ja/tournois/${slug}`)

  useSeoMeta({ title: 'Interface Juge Arbitre' })

  const seriesList = computed(() => tournament.value?.series ?? [])
  const selectedSeriesId = ref<number | null>(null)
  const tournamentView = ref<'desk' | 'forecast'>('desk')
  const jaTab = ref<'registrations' | 'bracket'>('bracket')
  const registrations = ref<SeriesRegistration[]>([])
  const loadingReg = ref(false)
  const addRegOpen = ref(false)
  const currentSeries = computed(
    () => seriesList.value.find(s => s.id === selectedSeriesId.value) ?? null
  )
  watch(selectedSeriesId, id => {
    if (id) {
      loadRegistrations(id)
      jaTab.value = 'bracket'
    }
  })
  watch(
    seriesList,
    list => {
      const first = list[0]
      if (first && !selectedSeriesId.value) selectedSeriesId.value = first.id
    },
    { immediate: true }
  )

  async function loadRegistrations(id: number) {
    loadingReg.value = true
    try {
      registrations.value = await $fetch<SeriesRegistration[]>(
        `/api/ja/tournois/${slug}/series/${id}/registrations`
      )
    } finally {
      loadingReg.value = false
    }
  }

  async function refreshSeriesState(): Promise<void> {
    await refreshTournament()
    await refreshRegistrations()
  }

  function returnToRegistrations(seriesId: number): void {
    if (selectedSeriesId.value === seriesId) jaTab.value = 'registrations'
  }

  async function refreshRegistrations() {
    if (selectedSeriesId.value) await loadRegistrations(selectedSeriesId.value)
  }

  // Registration stats
  const presentCount = computed(
    () =>
      registrations.value.filter(r => r.attendanceStatus === 'present').length
  )
  const absentCount = computed(
    () =>
      registrations.value.filter(r => r.attendanceStatus === 'absent').length
  )
  const unknownCount = computed(
    () =>
      registrations.value.filter(r => r.attendanceStatus === 'unknown').length
  )

  async function logout() {
    if (me.value?.isAdmin) {
      await navigateTo(`/admin/tournois/${slug}`)
    } else {
      await $fetch('/api/ja/auth', { method: 'DELETE' })
      await navigateTo(`/tournois/${slug}/ja/login`)
    }
  }

  // Status label
  const statusLabel: Record<string, string> = {
    draft: 'Brouillon',
    registration: 'Inscriptions',
    bracket_generated: 'Tableau prêt',
    in_progress: 'En cours',
    finished: 'Terminée'
  }
  const statusColor: Record<string, string> = {
    draft: 'text-gray-400',
    registration: 'text-blue-600',
    bracket_generated: 'text-amber-600',
    in_progress: 'text-green-600',
    finished: 'text-gray-500'
  }
</script>

<template>
  <div class="max-w-screen-xl mx-auto px-4 py-6">
    <!-- Header -->
    <div class="flex items-start justify-between mb-6 flex-wrap gap-3">
      <div>
        <h1 class="text-xl font-bold text-gray-900">
          {{ tournament?.name ?? 'Interface Juge Arbitre' }}
        </h1>
        <UBadge
          v-if="tournament?.isDemo"
          class="mt-2"
          color="info"
          variant="subtle"
          icon="i-heroicons-beaker"
          >DEV · Démonstration</UBadge
        >
        <p class="text-sm text-gray-500 mt-0.5">
          JA : <strong>{{ me?.jaName }}</strong>
        </p>
      </div>
      <UButton
        variant="ghost"
        color="neutral"
        size="sm"
        :icon="
          me?.isAdmin
            ? 'i-heroicons-arrow-left'
            : 'i-heroicons-arrow-right-on-rectangle'
        "
        @click="logout"
      >
        {{ me?.isAdmin ? 'Retour admin' : 'Déconnexion' }}
      </UButton>
    </div>

    <div class="flex flex-wrap gap-2 mb-5">
      <UButton
        color="neutral"
        :variant="tournamentView === 'desk' ? 'solid' : 'outline'"
        @click="tournamentView = 'desk'"
        >Poste JA</UButton
      >
      <UButton
        icon="i-heroicons-calendar-days"
        color="neutral"
        :variant="tournamentView === 'forecast' ? 'solid' : 'outline'"
        @click="tournamentView = 'forecast'"
        >Prévision</UButton
      >
    </div>
    <TournamentForecastBoard
      v-if="tournamentView === 'forecast'"
      :slug="slug"
      api-base="/api/ja/tournois"
    />

    <div
      v-else-if="seriesList.length === 0"
      class="text-center text-gray-400 py-20"
    >
      Aucune série pour ce tournoi.
    </div>

    <template v-else>
      <!-- Series selector -->
      <TournamentSeriesSelector
        :series="seriesList"
        :model-value="selectedSeriesId"
        class="mb-5"
        @update:model-value="selectedSeriesId = $event"
      />

      <!-- Stats bar (inscriptions tab) -->
      <div v-if="currentSeries" class="flex flex-wrap gap-4 mb-4 text-sm">
        <span class="text-gray-500">
          <strong class="text-gray-900">{{ registrations.length }}</strong>
          inscrits
        </span>
        <span class="text-green-600 font-medium"
          >{{ presentCount }} présents</span
        >
        <span class="text-red-500 font-medium">{{ absentCount }} absents</span>
        <span v-if="unknownCount" class="text-gray-400"
          >{{ unknownCount }} non confirmés</span
        >
        <span
          class="ml-auto text-xs font-semibold uppercase tracking-wide"
          :class="statusColor[currentSeries.status]"
        >
          {{ statusLabel[currentSeries.status] }}
        </span>
      </div>

      <div class="mb-4 flex gap-2">
        <UButton
          color="neutral"
          variant="outline"
          @click="jaTab = 'registrations'"
          >Inscriptions</UButton
        >
        <UButton @click="jaTab = 'bracket'">Poste du tournoi intégral</UButton>
        <UButton
          v-if="
            currentSeries &&
            ['draft', 'registration'].includes(currentSeries.status)
          "
          icon="i-heroicons-user-plus"
          @click="addRegOpen = true"
          >Inscrire</UButton
        >
      </div>
      <TournamentDemoRegistrations
        v-if="
          jaTab === 'registrations' &&
          tournament?.isDemo &&
          currentSeries &&
          ['draft', 'registration'].includes(currentSeries.status)
        "
        class="mb-4"
        :slug="slug"
        :series-id="currentSeries.id"
        :doubles="currentSeries.seriesFormat === 'doubles'"
        api-base="/api/ja/tournois"
        @refresh="refreshSeriesState"
      />
      <TournamentRegistrationTable
        v-if="jaTab === 'registrations'"
        :roster-locked="
          !!currentSeries &&
          !['draft', 'registration'].includes(currentSeries.status)
        "
        :registrations="registrations"
        :series-format="currentSeries?.seriesFormat ?? 'singles'"
        :slug="slug"
        :series-id="selectedSeriesId!"
        :loading="loadingReg"
        api-base="/api/ja/tournois"
        @refresh="refreshRegistrations"
      />
      <TournamentIntegralBoard
        v-else-if="selectedSeriesId"
        :key="selectedSeriesId"
        :slug="slug"
        :series-id="selectedSeriesId"
        :tournament-name="tournament?.name ?? ''"
        @refresh="refreshSeriesState"
        @pools-cancelled="returnToRegistrations"
      />
    </template>

    <!-- Modals -->
    <TournamentJaMultiSeriesRegistrationModal
      :open="addRegOpen"
      :series="seriesList"
      :slug="slug"
      @update:open="addRegOpen = $event"
      @refresh="refreshRegistrations"
    />
  </div>
</template>
