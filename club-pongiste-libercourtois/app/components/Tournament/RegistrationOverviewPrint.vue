<script setup lang="ts">
  import type {
    RegistrationOverviewPlayer,
    RegistrationOverviewSeries
  } from '~~/shared/tournament-registrations'
  import { registrationPrintGroups } from '~/utils/tournament-registration-overview'
  import { registrationPrintDocument } from '~/utils/registration-print'
  import printStyles from '~/assets/css/tournament-registrations-print.css?raw'

  const props = defineProps<{
    tournamentName: string
    series: RegistrationOverviewSeries[]
    players: RegistrationOverviewPlayer[]
    search: string
  }>()
  const groups = computed(function () {
    return registrationPrintGroups(props.series)
  })
  const printRoot = ref<HTMLDivElement | null>(null)
  let printFrame: HTMLIFrameElement | null = null

  /** Print a separate document so every page uses the same landscape layout. */
  function print(): void {
    if (!printRoot.value) return
    printFrame?.remove()
    const frame = document.createElement('iframe')
    frame.title = 'Impression des inscriptions'
    frame.setAttribute('aria-hidden', 'true')
    frame.tabIndex = -1
    frame.style.cssText =
      'position: fixed; left: -10000px; width: 297mm; height: 210mm; border: 0;'
    frame.onload = function () {
      const printWindow = frame.contentWindow
      if (!printWindow) {
        frame.remove()
        return
      }
      printWindow.addEventListener(
        'afterprint',
        function () {
          frame.remove()
        },
        { once: true }
      )
      printWindow.focus()
      printWindow.print()
    }
    frame.srcdoc = registrationPrintDocument(
      printRoot.value.outerHTML,
      printStyles
    )
    printFrame = frame
    document.body.append(frame)
  }

  onBeforeUnmount(function () {
    printFrame?.remove()
  })
  defineExpose({ print })
</script>

<template>
  <div ref="printRoot" class="registration-print">
    <section
      v-for="(group, index) in groups"
      :key="index"
      class="registration-print-group"
    >
      <h1>{{ tournamentName }} — Inscriptions</h1>
      <p>
        {{ players.length }} joueurs · Séries {{ index * 5 + 1 }}–{{
          index * 5 + group.length
        }}
        sur {{ series.length }}
        <template v-if="search"> · Recherche : {{ search }}</template>
      </p>
      <p>× Inscrit · Case vide : non inscrit</p>
      <table class="registration-print-table">
        <thead>
          <tr>
            <th class="registration-print-name">Nom</th>
            <th class="registration-print-club">Club</th>
            <th v-for="column in group" :key="column.id">
              {{ column.name }}
              <small
                >{{ column.date.split('-').reverse().join('/') }} ·
                {{ column.startTime }}</small
              >
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="player in players" :key="player.identity">
            <th scope="row">{{ player.lastName }} {{ player.firstName }}</th>
            <td>{{ player.club ?? '—' }}</td>
            <td
              v-for="column in group"
              :key="column.id"
              class="registration-print-status"
            >
              <span
                v-if="player.registrations[column.id]?.length"
                aria-label="Inscrit"
                class="registration-print-mark"
              >
                ×
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<style>
  .registration-print {
    display: none;
  }
</style>
