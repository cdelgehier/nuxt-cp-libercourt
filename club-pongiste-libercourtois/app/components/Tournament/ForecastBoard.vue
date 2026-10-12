<script setup lang="ts">
  import {
    DEFAULT_FORECAST_ENTRANTS,
    forecastConfigSchema
  } from '~~/shared/tournament-forecast'
  import type {
    ForecastConfig,
    ForecastDocument,
    ForecastResult,
    ForecastSeries
  } from '~~/shared/tournament-forecast'
  import {
    forecastColor,
    forecastDateTime,
    forecastTime,
    nextForecastDate,
    removeForecastDay
  } from '~/utils/forecast-agenda'

  const props = withDefaults(
    defineProps<{ slug: string; apiBase?: string }>(),
    { apiBase: '/api/admin/tournois' }
  )
  const endpoint = `${props.apiBase}/${encodeURIComponent(props.slug)}/forecast`
  const config = ref<ForecastConfig | null>(null)
  const document = ref<ForecastDocument | null>(null)
  const result = ref<ForecastResult | null>(null)
  const loading = ref(true),
    calculating = ref(false),
    saving = ref(false)
  const error = ref(''),
    saveError = ref(''),
    savedJson = ref('')
  const selectedKey = ref<string | null>(null),
    editorOpen = ref(false),
    reloadOpen = ref(false)
  const selected = computed(function () {
    return (
      config.value?.series.find(function (series) {
        return series.key === selectedKey.value
      }) ?? null
    )
  })
  const selectedBlock = computed(function () {
    return (
      result.value?.series.find(function (series) {
        return series.key === selectedKey.value
      }) ?? null
    )
  })
  const selectedRegistrations = computed(function () {
    return (
      document.value?.availableSeries.find(function (series) {
        return series.id === selected.value?.seriesId
      })?.registrations ?? 0
    )
  })
  const dirty = computed(function () {
    return config.value && JSON.stringify(config.value) !== savedJson.value
  })
  const valid = computed(function () {
    return forecastConfigSchema.safeParse(config.value).success
  })
  const insufficientBlocks = computed(function () {
    return (
      result.value?.series.filter(function (entry) {
        return entry.status === 'insufficient'
      }) ?? []
    )
  })
  const overrunBlocks = computed(function () {
    return (
      result.value?.series.filter(function (entry) {
        return entry.overrunMinutes > 0
      }) ?? []
    )
  })
  const dayOptions = computed(function () {
    return (
      config.value?.days.map(function (day) {
        return day.date
      }) ?? []
    )
  })
  const missingSeries = computed(function () {
    return (
      document.value?.availableSeries.filter(function (series) {
        return !config.value?.series.some(function (entry) {
          return entry.seriesId === series.id
        })
      }) ?? []
    )
  })
  let revision = 0,
    timer: ReturnType<typeof setTimeout> | undefined

  watch(
    config,
    function () {
      revision++
      clearTimeout(timer)
      calculating.value = true
      timer = setTimeout(recalculate, 350)
    },
    { deep: true, flush: 'sync' }
  )
  onMounted(load)
  onBeforeUnmount(function () {
    clearTimeout(timer)
    revision++
  })

  /** Preserve local edits until an explicit save or reload. */
  async function load(): Promise<void> {
    loading.value = true
    try {
      const loaded = await $fetch<ForecastDocument>(endpoint)
      document.value = loaded
      savedJson.value = JSON.stringify(loaded.config)
      config.value = structuredClone(loaded.config)
      saveError.value = ''
      error.value = ''
      reloadOpen.value = false
    } catch (cause) {
      error.value = errorMessage(cause)
    } finally {
      loading.value = false
    }
  }
  async function recalculate(): Promise<void> {
    const token = revision
    const parsed = forecastConfigSchema.safeParse(config.value)
    if (!parsed.success) {
      error.value = parsed.error.issues[0]?.message ?? 'Hypothèses invalides.'
      calculating.value = false
      return
    }
    try {
      const simulated = await $fetch<ForecastResult>(`${endpoint}/simulate`, {
        method: 'POST',
        body: parsed.data
      })
      if (token !== revision) return
      result.value = simulated
      error.value = ''
    } catch (cause) {
      if (token === revision) error.value = errorMessage(cause)
    } finally {
      if (token === revision) calculating.value = false
    }
  }
  async function save(): Promise<void> {
    if (!config.value || !document.value) return
    const snapshot = JSON.parse(JSON.stringify(config.value)) as ForecastConfig
    saving.value = true
    saveError.value = ''
    try {
      const saved = await $fetch<{ version: number; updatedAt: string }>(
        endpoint,
        {
          method: 'PUT',
          body: { config: snapshot, version: document.value.version }
        }
      )
      document.value.version = saved.version
      document.value.updatedAt = saved.updatedAt
      savedJson.value = JSON.stringify(snapshot)
    } catch (cause) {
      saveError.value = errorMessage(cause)
    } finally {
      saving.value = false
    }
  }
  function errorMessage(cause: unknown): string {
    const response = cause as { data?: { message?: string }; message?: string }
    return (
      response.data?.message ??
      response.message ??
      'Une erreur est survenue. Vos saisies sont conservées.'
    )
  }
  function select(key: string): void {
    selectedKey.value = key
    editorOpen.value = true
  }
  function move(key: string, date: string, time: string): void {
    const series = config.value?.series.find(function (entry) {
      return entry.key === key
    })
    if (series) {
      series.date = date
      series.startTime = time
    }
  }
  function addDay(): void {
    if (!config.value) return
    const last = [...config.value.days]
      .sort(function (a, b) {
        return a.date.localeCompare(b.date)
      })
      .at(-1)!
    config.value.days.push({
      date: nextForecastDate(last.date),
      opening: '09:00',
      closing: '20:00'
    })
  }
  function changeDate(index: number, date: string): void {
    if (!config.value) return
    const old = config.value.days[index]!.date
    config.value.days[index]!.date = date
    for (const series of config.value.series)
      if (series.date === old) series.date = date
  }
  function deleteDay(index: number): void {
    if (config.value && config.value.days.length > 1)
      removeForecastDay(config.value, index)
  }
  function addSeries(realId: number | null = null): void {
    if (!config.value) return
    const real = document.value?.availableSeries.find(function (series) {
      return series.id === realId
    })
    const entry: ForecastSeries = {
      key: real ? `series-${real.id}` : `hypothetical-${crypto.randomUUID()}`,
      seriesId: real?.id ?? null,
      name: real?.name ?? 'Nouvelle série',
      format: real?.format ?? 'singles',
      type: real?.type ?? 'standard',
      mode: real ? 'registrations' : 'estimated',
      estimatedEntrants: DEFAULT_FORECAST_ENTRANTS,
      date: config.value.days[0]!.date,
      startTime: config.value.days[0]!.opening,
      matchMinutes: real?.type === 'speedy' ? 10 : 30,
      tableCap: null
    }
    config.value.series.push(entry)
    select(entry.key)
  }
  function removeSeries(): void {
    if (!config.value || !selected.value) return
    config.value.series.splice(config.value.series.indexOf(selected.value), 1)
    editorOpen.value = false
  }
  function reorder(index: number, offset: number): void {
    if (!config.value) return
    const other = index + offset
    if (other < 0 || other >= config.value.series.length) return
    const entry = config.value.series.splice(index, 1)[0]!
    config.value.series.splice(other, 0, entry)
  }
  function changeType(value: string): void {
    if (!selected.value) return
    selected.value.type = value as ForecastSeries['type']
    selected.value.matchMinutes = value === 'speedy' ? 10 : 30
  }
  const phaseLabels = {
    pools: 'Poules',
    playoffs: 'Barrages',
    placement: 'Classement intégral'
  }
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 class="text-xl font-semibold">Prévision du tournoi</h2>
        <p class="text-sm text-muted">
          Estimation selon les hypothèses renseignées
        </p>
        <p class="mt-1 text-xs text-muted">
          Ces réglages sont indépendants du programme annoncé. Les fins estimées
          ne sont pas garanties.
        </p>
      </div>
      <div class="flex gap-2">
        <UButton
          color="neutral"
          variant="outline"
          icon="i-heroicons-arrow-path"
          :disabled="loading || saving"
          @click="dirty ? (reloadOpen = true) : load()"
          >Recharger</UButton
        >
        <UButton
          icon="i-heroicons-bookmark"
          :loading="saving"
          :disabled="!config || !valid || (!dirty && document?.version !== 0)"
          @click="save"
          >Enregistrer</UButton
        >
      </div>
    </div>
    <p v-if="document" class="text-xs text-muted">
      {{
        dirty
          ? 'Modifications non enregistrées'
          : document.updatedAt
            ? `Enregistrée le ${forecastDateTime(document.updatedAt)}`
            : 'Prévision initiale · à enregistrer après vos ajustements'
      }}
    </p>
    <UAlert
      v-if="saveError"
      color="error"
      title="Enregistrement impossible"
      :description="saveError"
    />
    <UAlert
      v-if="error"
      color="error"
      title="Calcul indisponible"
      :description="error"
    />
    <div v-if="loading" class="py-8 text-muted">
      Chargement de la prévision…
    </div>

    <template v-if="config">
      <UCard>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <UFormField label="Tables disponibles">
            <template #hint>
              <TournamentForecastHelp label="Tables disponibles">
                <p>
                  Nombre total de tables pour la prévision, commun à toutes les
                  journées. Les séries se partagent ces tables.
                </p>
              </TournamentForecastHelp>
            </template>
            <UInput
              v-model.number="config.tableCount"
              type="number"
              :min="1"
              :max="200"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Inscrits sur place (%)">
            <template #hint>
              <TournamentForecastHelp label="Inscrits sur place">
                <p>
                  Ajouté au nombre saisi ou aux inscrits actuels, puis arrondi
                  au supérieur. Avec 20 joueurs et 15 %, le calcul prévoit 23
                  joueurs.
                </p>
              </TournamentForecastHelp>
            </template>
            <UInput
              v-model.number="config.growthPercent"
              type="number"
              :min="0"
              :max="100"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Marge de durée (%)">
            <template #hint>
              <TournamentForecastHelp label="Marge de durée">
                <p>
                  Allonge chaque match pour garder une marge, avec arrondi à la
                  minute supérieure. Un match de 30 minutes avec 15 % de marge
                  est prévu sur 35 minutes.
                </p>
                <p>Cette marge ne change pas le nombre de participants.</p>
              </TournamentForecastHelp>
            </template>
            <UInput
              v-model.number="config.durationMarginPercent"
              type="number"
              :min="0"
              :max="100"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Repos entre matchs (min)">
            <template #hint>
              <TournamentForecastHelp label="Repos entre matchs">
                <p>
                  Temps minimum entre la fin d’un match et le suivant pour un
                  même joueur, y compris entre ses séries en simple et en
                  double.
                </p>
              </TournamentForecastHelp>
            </template>
            <UInput
              v-model.number="config.restMinutes"
              type="number"
              :min="0"
              :max="120"
              class="w-full"
            />
          </UFormField>
        </div>
        <div class="mt-5 space-y-3">
          <div
            v-for="(day, index) in config.days"
            :key="index"
            class="flex flex-wrap items-end gap-3"
          >
            <UFormField :label="`Jour ${index + 1}`"
              ><UInput
                :model-value="day.date"
                type="date"
                @update:model-value="changeDate(index, String($event))"
            /></UFormField>
            <UFormField label="Ouverture"
              ><UInput v-model="day.opening" type="time"
            /></UFormField>
            <UFormField label="Fermeture"
              ><UInput v-model="day.closing" type="time"
            /></UFormField>
            <UButton
              v-if="config.days.length > 1"
              color="neutral"
              variant="ghost"
              icon="i-heroicons-trash"
              :aria-label="`Retirer le jour ${index + 1}`"
              @click="deleteDay(index)"
            />
          </div>
          <UButton
            v-if="config.days.length < 31"
            color="neutral"
            variant="outline"
            size="sm"
            icon="i-heroicons-plus"
            @click="addDay"
            >Ajouter une journée</UButton
          >
        </div>
      </UCard>

      <div class="flex flex-wrap gap-2 items-center">
        <UButton
          icon="i-heroicons-plus"
          color="neutral"
          variant="outline"
          :disabled="config.series.length >= 64"
          @click="addSeries()"
          >Série hypothétique</UButton
        >
        <UButton
          v-for="series in missingSeries"
          :key="series.id"
          color="neutral"
          variant="ghost"
          size="sm"
          @click="addSeries(series.id)"
          >Ajouter {{ series.name }}</UButton
        >
        <span v-if="calculating" class="text-sm text-muted" role="status"
          >Recalcul…</span
        >
        <span v-else-if="result" class="ml-auto text-sm"
          >Dernière fin :
          <strong>{{ forecastDateTime(result.lastEnd) }}</strong></span
        >
      </div>

      <div class="flex flex-wrap gap-2">
        <div
          v-for="(series, index) in config.series"
          :key="series.key"
          class="flex items-center gap-1 rounded-lg border border-default p-1"
        >
          <span
            class="w-2 h-2 rounded-full ml-1"
            :style="{ background: forecastColor(series.key) }"
          />
          <UButton
            color="neutral"
            variant="ghost"
            size="sm"
            @click="select(series.key)"
            >{{ series.name }}</UButton
          >
          <UButton
            v-if="index"
            icon="i-heroicons-chevron-left"
            color="neutral"
            variant="ghost"
            size="xs"
            :aria-label="`Avancer ${series.name}`"
            @click="reorder(index, -1)"
          />
          <UButton
            v-if="index < config.series.length - 1"
            icon="i-heroicons-chevron-right"
            color="neutral"
            variant="ghost"
            size="xs"
            :aria-label="`Reculer ${series.name}`"
            @click="reorder(index, 1)"
          />
        </div>
      </div>
      <p v-if="!config.series.length" class="text-sm text-muted">
        Ajoutez une série hypothétique pour préparer le tournoi.
      </p>
      <template v-if="result">
        <UAlert
          v-for="block in insufficientBlocks"
          :key="block.key"
          color="info"
          variant="subtle"
          :title="`${block.name} : effectif insuffisant`"
          description="Il faut au moins deux participants pour jouer."
        />
        <UAlert
          v-for="block in overrunBlocks"
          :key="block.key"
          color="error"
          variant="subtle"
          :title="`${block.name} dépasse la fermeture de ${block.overrunMinutes} min`"
          :description="`Fin estimée : ${forecastDateTime(block.end)}. Le calcul se poursuit après la fermeture.`"
        />
        <div :class="{ 'opacity-60': calculating || error }">
          <TournamentForecastAgenda
            :config="config"
            :result="result"
            @select="select"
            @move="move"
          />
        </div>
      </template>

      <UModal
        v-model:open="editorOpen"
        title="Hypothèses de la série"
        description="Le départ se règle ici ou par déplacement dans l’agenda. La durée est calculée."
      >
        <template #body>
          <div v-if="selected" class="space-y-5">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UFormField label="Nom" class="sm:col-span-2"
                ><UInput v-model="selected.name" class="w-full"
              /></UFormField>
              <UFormField label="Format"
                ><USelect
                  v-model="selected.format"
                  :disabled="selected.seriesId !== null"
                  :items="[
                    { label: 'Simple', value: 'singles' },
                    { label: 'Double', value: 'doubles' }
                  ]"
                  class="w-full"
              /></UFormField>
              <UFormField label="Règles"
                ><USelect
                  :model-value="selected.type"
                  :items="[
                    { label: 'Classique', value: 'standard' },
                    { label: 'Speedy', value: 'speedy' },
                    { label: 'Handicap', value: 'handicap' }
                  ]"
                  class="w-full"
                  @update:model-value="changeType(String($event))"
              /></UFormField>
              <UFormField label="Effectif utilisé">
                <template #hint>
                  <TournamentForecastHelp label="Effectif utilisé">
                    <p>
                      Avant les inscriptions, choisissez « Saisie manuelle » et
                      entrez le nombre de joueurs ou de paires que vous
                      attendez. Aucun inscrit n’est nécessaire.
                    </p>
                    <p>
                      « Inscrits actuels » utilise les inscriptions de la série,
                      en excluant les absents et les forfaits. Les présences
                      encore inconnues comptent.
                    </p>
                    <p>
                      Dans les deux cas, le pourcentage d’inscriptions sur place
                      est ajouté à cet effectif de base.
                    </p>
                  </TournamentForecastHelp>
                </template>
                <USelect
                  v-model="selected.mode"
                  :items="
                    selected.seriesId === null
                      ? [{ label: 'Saisie manuelle', value: 'estimated' }]
                      : [
                          { label: 'Saisie manuelle', value: 'estimated' },
                          { label: 'Inscrits actuels', value: 'registrations' }
                        ]
                  "
                  class="w-full"
                />
              </UFormField>
              <UFormField
                v-if="selected.mode === 'estimated'"
                :label="
                  selected.format === 'doubles'
                    ? 'Paires attendues'
                    : 'Joueurs attendus'
                "
                help="À saisir, même sans aucun inscrit."
                ><UInput
                  v-model.number="selected.estimatedEntrants"
                  type="number"
                  :min="0"
                  :max="512"
                  class="w-full"
              /></UFormField>
              <UFormField
                v-else
                :label="
                  selected.format === 'doubles'
                    ? 'Paires inscrites'
                    : 'Joueurs inscrits'
                "
                help="Absents et forfaits exclus."
              >
                <UInput
                  :model-value="selectedRegistrations"
                  readonly
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Journée"
                ><USelect
                  v-model="selected.date"
                  :items="dayOptions"
                  class="w-full"
              /></UFormField>
              <UFormField label="Départ demandé"
                ><UInput
                  v-model="selected.startTime"
                  type="time"
                  class="w-full"
              /></UFormField>
              <UFormField label="Durée d’un match (min)">
                <template #hint>
                  <TournamentForecastHelp label="Durée d’un match">
                    <p>
                      Durée moyenne que vous prévoyez pour un match, avant la
                      marge de durée et le repos entre matchs.
                    </p>
                  </TournamentForecastHelp>
                </template>
                <UInput
                  v-model.number="selected.matchMinutes"
                  type="number"
                  :min="1"
                  :max="240"
                  class="w-full"
                />
              </UFormField>
              <UFormField
                label="Plafond de tables"
                help="Vide : partage automatique."
              >
                <template #hint>
                  <TournamentForecastHelp label="Plafond de tables">
                    <p>
                      Nombre maximum de tables utilisées en même temps par cette
                      série, y compris celles réservées à ses poules.
                    </p>
                    <p>
                      Par exemple, 2 limite la série à deux tables simultanées.
                      Ce réglage ne garantit pas leur disponibilité : les autres
                      séries les utilisent aussi.
                    </p>
                    <p>
                      Laissez vide pour partager automatiquement toutes les
                      tables disponibles, sans plafond propre à cette série.
                    </p>
                  </TournamentForecastHelp>
                </template>
                <UInput
                  :model-value="selected.tableCap ?? ''"
                  type="number"
                  :min="1"
                  :max="config.tableCount"
                  class="w-full"
                  @update:model-value="
                    selected.tableCap = $event === '' ? null : Number($event)
                  "
                />
              </UFormField>
            </div>
            <div
              v-if="selectedBlock"
              class="rounded-lg bg-elevated p-4 text-sm space-y-2"
            >
              <p>
                <strong>{{ selectedBlock.baseEntrants }}</strong>
                {{ selected.format === 'doubles' ? 'paires' : 'joueurs' }} de
                base →
                <strong>{{ selectedBlock.projectedEntrants }}</strong> projetés
              </p>
              <p>
                {{ selectedBlock.effectiveMatchMinutes }} min par match avec
                marge · {{ selectedBlock.matchCount }} rencontres
              </p>
              <p>
                Départ {{ forecastTime(selectedBlock.start) }} · fin
                {{ forecastDateTime(selectedBlock.end) }}
              </p>
              <p v-if="selectedBlock.delayMinutes">
                Retard de départ : {{ selectedBlock.delayMinutes }} min
              </p>
              <p
                v-if="
                  selectedBlock.tableDelayMinutes ||
                  selectedBlock.playerDelayMinutes
                "
                class="text-muted"
              >
                Attente au départ : tables
                {{ selectedBlock.tableDelayMinutes }} min · joueurs
                {{ selectedBlock.playerDelayMinutes }} min
              </p>
              <ol class="space-y-1 pt-2">
                <li v-for="phase in selectedBlock.phases" :key="phase.name">
                  {{ phaseLabels[phase.name]
                  }}{{
                    phase.name === 'pools'
                      ? ` (${selectedBlock.poolCount})`
                      : ''
                  }}
                  : {{ phase.matches }} matchs ·
                  {{ forecastTime(phase.start) }}–{{ forecastTime(phase.end) }}
                </li>
              </ol>
            </div>
            <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
            <div class="flex justify-between gap-2">
              <UButton color="error" variant="ghost" @click="removeSeries"
                >Retirer de la prévision</UButton
              >
              <UButton @click="editorOpen = false">Fermer</UButton>
            </div>
          </div>
        </template>
      </UModal>
    </template>
    <UModal
      v-model:open="reloadOpen"
      title="Recharger la prévision enregistrée ?"
      description="Vos modifications locales seront remplacées."
    >
      <template #footer
        ><UButton color="neutral" variant="outline" @click="reloadOpen = false"
          >Conserver mes saisies</UButton
        ><UButton @click="load">Recharger</UButton></template
      >
    </UModal>
  </div>
</template>
