<script setup lang="ts">
  import type {
    RegistrationOverview,
    RegistrationOverviewEntry
  } from '~~/shared/tournament-registrations'
  import {
    registrationLabel,
    registrationPaymentLabel
  } from '~/utils/tournament-registration-overview'

  const props = withDefaults(
    defineProps<{ slug: string; tournamentName: string; apiBase?: string }>(),
    { apiBase: '/api/admin/tournois' }
  )
  const emit = defineEmits<{ 'open-series': [number] }>()
  const {
    data: overview,
    status,
    error,
    refresh
  } = await useFetch<RegistrationOverview>(
    `${props.apiBase}/${encodeURIComponent(props.slug)}/registrations`,
    { server: false }
  )
  const search = ref('')
  const registrationPrint = ref<{ print(): void } | null>(null)
  const page = ref(1)
  const pageSize = 25
  const filteredPlayers = computed(function () {
    const query = normalize(search.value)
    return (overview.value?.players ?? []).filter(function (player) {
      return normalize(
        `${player.lastName} ${player.firstName} ${player.firstName} ${player.lastName} ${player.club ?? ''} ${player.licenceNumber ?? ''}`
      ).includes(query)
    })
  })
  const visiblePlayers = computed(function () {
    return filteredPlayers.value.slice(
      (page.value - 1) * pageSize,
      page.value * pageSize
    )
  })
  watch(search, function () {
    page.value = 1
  })
  watch(filteredPlayers, function (players) {
    page.value = Math.min(
      page.value,
      Math.max(1, Math.ceil(players.length / pageSize))
    )
  })
  const { pause } = useIntervalFn(refresh, 30_000)
  onBeforeUnmount(pause)

  function normalize(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
  }
  function entryColor(
    entry: RegistrationOverviewEntry
  ): 'error' | 'neutral' | 'success' {
    if (entry.isForfeit) return 'error'
    if (entry.attendanceStatus === 'absent') return 'neutral'
    return 'success'
  }
  function print(): void {
    registrationPrint.value?.print()
  }
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 class="text-lg font-semibold">Inscriptions du tournoi</h2>
        <p class="text-sm text-muted">
          Un joueur par ligne, toutes ses séries en colonnes.
        </p>
      </div>
      <div class="flex gap-2">
        <UButton
          color="neutral"
          variant="outline"
          icon="i-heroicons-arrow-path"
          :loading="status === 'pending'"
          @click="refresh()"
          >Actualiser</UButton
        >
        <UButton
          color="neutral"
          variant="outline"
          icon="i-heroicons-printer"
          :disabled="!filteredPlayers.length || status === 'pending'"
          @click="print"
          >Imprimer la liste</UButton
        >
      </div>
    </div>
    <UAlert
      v-if="error"
      color="error"
      title="Chargement des inscriptions impossible"
      description="Réessayez avec le bouton Actualiser."
    />
    <p
      v-if="!overview && status === 'pending'"
      class="text-sm text-muted"
      role="status"
    >
      Chargement des inscriptions…
    </p>
    <template v-if="overview">
      <div class="flex flex-wrap items-center gap-3">
        <UInput
          v-model="search"
          icon="i-heroicons-magnifying-glass"
          placeholder="Nom, club ou licence"
          aria-label="Rechercher un joueur ou un club"
          class="w-full sm:w-80"
        />
        <span class="text-sm text-muted"
          >{{ filteredPlayers.length }} / {{ overview.players.length }} joueurs
          · {{ overview.series.length }} séries</span
        >
      </div>
      <p class="text-xs text-muted">
        Cliquez sur une série pour ouvrir ses inscriptions. La recherche
        s’applique aussi à l’impression.
      </p>
      <div
        v-if="!overview.series.length"
        class="rounded-xl border border-default p-8 text-center text-muted"
      >
        Aucune série réelle pour ce tournoi. Les séries de la prévision n’ont
        pas encore d’inscriptions.
      </div>
      <div
        v-else-if="!overview.players.length"
        class="rounded-xl border border-default p-8 text-center text-muted"
      >
        Aucun joueur inscrit pour le moment.
      </div>
      <div
        v-else-if="!filteredPlayers.length"
        class="rounded-xl border border-default p-8 text-center text-muted"
      >
        Aucun joueur ne correspond à la recherche.
      </div>
      <div
        v-else
        class="max-h-[65vh] overflow-auto rounded-xl border border-default"
        tabindex="0"
        role="region"
        aria-label="Inscriptions par joueur et par série"
      >
        <table class="w-full border-collapse text-sm">
          <caption class="sr-only">
            Inscriptions de
            {{
              tournamentName
            }}. Les partenaires de doubles apparaissent chacun sur une ligne.
          </caption>
          <thead class="sticky top-0 z-20 bg-elevated">
            <tr>
              <th
                scope="col"
                class="sticky left-0 z-30 min-w-48 bg-elevated px-4 py-3 text-left"
              >
                Nom
              </th>
              <th scope="col" class="min-w-40 px-4 py-3 text-left">Club</th>
              <th
                v-for="column in overview.series"
                :key="column.id"
                scope="col"
                class="min-w-44 max-w-64 px-3 py-3 text-left"
              >
                <button
                  type="button"
                  class="font-semibold text-blue-700 hover:underline"
                  :aria-label="`Ouvrir les inscriptions de ${column.name}`"
                  @click="emit('open-series', column.id)"
                >
                  {{ column.name }}
                </button>
                <p class="mt-1 text-xs font-normal text-muted">
                  {{ column.date.split('-').reverse().join('/') }} ·
                  {{ column.startTime }}
                </p>
                <p class="text-xs font-normal text-muted">
                  {{ column.registrationCount }}
                  {{ column.format === 'doubles' ? 'paire' : 'joueur'
                  }}{{ column.registrationCount > 1 ? 's' : '' }}
                </p>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="player in visiblePlayers"
              :key="player.identity"
              class="border-t border-default"
            >
              <th
                scope="row"
                class="sticky left-0 z-10 bg-default px-4 py-3 text-left align-top"
              >
                <span class="font-medium"
                  >{{ player.lastName }} {{ player.firstName }}</span
                >
                <p class="mt-1 text-xs font-normal text-muted">
                  {{ Object.keys(player.registrations).length }} série{{
                    Object.keys(player.registrations).length > 1 ? 's' : ''
                  }}<span v-if="player.licenceNumber">
                    · {{ player.licenceNumber }}</span
                  >
                </p>
              </th>
              <td class="px-4 py-3 align-top">{{ player.club ?? '—' }}</td>
              <td
                v-for="column in overview.series"
                :key="column.id"
                class="px-3 py-3 align-top"
              >
                <div
                  v-for="entry in player.registrations[column.id] ?? []"
                  :key="entry.registrationId"
                  class="mb-1 last:mb-0"
                >
                  <UBadge
                    :color="entryColor(entry)"
                    variant="subtle"
                    :icon="
                      entry.isForfeit || entry.attendanceStatus === 'absent'
                        ? 'i-heroicons-minus-circle'
                        : 'i-heroicons-check-circle'
                    "
                    >{{ registrationLabel(entry) }}</UBadge
                  >
                  <p v-if="entry.partnerName" class="mt-1 text-xs text-muted">
                    Avec {{ entry.partnerName }}
                  </p>
                  <p
                    class="mt-1 text-xs"
                    :class="
                      entry.paymentStatus === 'paid'
                        ? 'text-green-700'
                        : 'text-muted'
                    "
                  >
                    {{ registrationPaymentLabel(entry) }}
                  </p>
                </div>
                <span
                  v-if="!player.registrations[column.id]"
                  class="text-muted"
                  aria-label="Non inscrit"
                  >—</span
                >
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <UPagination
        v-if="filteredPlayers.length > pageSize"
        v-model:page="page"
        :total="filteredPlayers.length"
        :items-per-page="pageSize"
        class="justify-end"
      />
      <TournamentRegistrationOverviewPrint
        v-if="filteredPlayers.length"
        ref="registrationPrint"
        :tournament-name="tournamentName"
        :series="overview.series"
        :players="filteredPlayers"
        :search="search"
      />
    </template>
  </div>
</template>
