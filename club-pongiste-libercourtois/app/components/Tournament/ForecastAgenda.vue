<script setup lang="ts">
  import type {
    ForecastConfig,
    ForecastResult
  } from '~~/shared/tournament-forecast'
  import {
    forecastColor,
    forecastDropTime,
    forecastDayItems,
    forecastWall,
    forecastDateTime,
    forecastTime
  } from '~/utils/forecast-agenda'

  const props = defineProps<{
    config: ForecastConfig
    result: ForecastResult
  }>()
  const emit = defineEmits<{
    select: [key: string]
    move: [key: string, date: string, time: string]
  }>()
  let grabbedOffset = 0
  const dragged = ref<string | null>(null)
  const dropTarget = ref<string | null>(null)
  const startMinute = computed(function () {
    let first = 540
    for (const day of props.config.days)
      first = Math.min(first, minutes(day.opening))
    for (const block of props.result.series)
      if (
        block.start &&
        block.end &&
        forecastWall(block.start).date !== forecastWall(block.end).date &&
        props.config.days.some(function (day) {
          return (
            day.date > forecastWall(block.start!).date &&
            day.date <= forecastWall(block.end!).date
          )
        })
      )
        first = 0
    for (const block of props.result.series)
      if (block.start)
        first = Math.min(first, forecastWall(block.start).minutes)
    return Math.floor(first / 60) * 60
  })
  const endMinute = computed(function () {
    let last = 1200
    for (const day of props.config.days)
      last = Math.max(last, minutes(day.closing))
    for (const block of props.result.series)
      if (block.end && block.start) {
        const start = forecastWall(block.start),
          end = forecastWall(block.end)
        last = Math.max(last, start.date === end.date ? end.minutes : 1440)
      }
    return Math.min(1440, Math.ceil(last / 60) * 60)
  })
  const hours = computed(function () {
    return Array.from(
      { length: (endMinute.value - startMinute.value) / 60 },
      function (_, index) {
        return startMinute.value + index * 60
      }
    )
  })
  const days = computed(function () {
    return [...props.config.days]
      .sort(function (a, b) {
        return a.date.localeCompare(b.date)
      })
      .map(function (day) {
        return {
          ...day,
          label: new Intl.DateTimeFormat('fr-FR', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            timeZone: 'UTC'
          }).format(new Date(`${day.date}T12:00:00Z`)),
          items: forecastDayItems(
            props.result.series,
            day.date,
            startMinute.value
          ),
          occupancy: props.result.occupancy.filter(function (slot) {
            return forecastWall(slot.start).date === day.date
          })
        }
      })
  })

  function minutes(time: string): number {
    return Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5))
  }
  function timeLabel(value: number): string {
    return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`
  }
  function dragStart(event: DragEvent, key: string): void {
    grabbedOffset =
      event.clientY -
      (event.currentTarget as HTMLElement).getBoundingClientRect().top
    dragged.value = key
    event.dataTransfer?.setData('text/plain', key)
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
  }
  function dragEnd(): void {
    dragged.value = null
    dropTarget.value = null
  }
  function drop(event: DragEvent, date: string): void {
    event.preventDefault()
    if (!dragged.value) return
    const target = event.currentTarget as HTMLElement
    const offset = event.clientY - target.getBoundingClientRect().top
    emit(
      'move',
      dragged.value,
      date,
      forecastDropTime(startMinute.value, offset, grabbedOffset)
    )
    dragEnd()
  }
</script>

<template>
  <div>
    <p class="mb-3 text-sm text-muted">
      Cliquez sur une série pour la régler. Sur ordinateur, déplacez-la dans
      l’agenda par pas de 15 minutes.
    </p>
    <div class="forecast-scroll rounded-xl border border-default bg-default">
      <div
        class="forecast-grid"
        :style="{
          gridTemplateColumns: `56px repeat(${days.length}, minmax(240px, 1fr))`
        }"
      >
        <div class="forecast-header" />
        <div
          v-for="day in days"
          :key="day.date"
          class="forecast-header font-semibold text-center"
        >
          {{ day.label }}
          <span class="block text-xs font-normal text-muted"
            >{{ day.opening }}–{{ day.closing }}</span
          >
        </div>
        <div
          class="relative border-r border-default"
          :style="{ height: `${endMinute - startMinute}px` }"
        >
          <span
            v-for="hour in hours"
            :key="hour"
            class="absolute right-2 text-xs text-muted"
            :style="{ top: `${hour - startMinute}px` }"
            >{{ timeLabel(hour) }}</span
          >
        </div>
        <div
          v-for="day in days"
          :key="day.date"
          class="forecast-day relative border-r border-default"
          :class="{
            'ring-2 ring-inset ring-blue-500': dropTarget === day.date
          }"
          :style="{ height: `${endMinute - startMinute}px` }"
          @dragover.prevent="dropTarget = day.date"
          @dragleave="dropTarget = null"
          @drop="drop($event, day.date)"
        >
          <div
            class="absolute inset-x-0 bg-gray-100/70 dark:bg-gray-800/60 pointer-events-none"
            :style="{
              top: 0,
              height: `${Math.max(0, minutes(day.opening) - startMinute)}px`
            }"
          />
          <div
            class="absolute inset-x-0 bg-red-50 dark:bg-red-950/30 pointer-events-none"
            :style="{
              top: `${minutes(day.closing) - startMinute}px`,
              bottom: 0
            }"
          />
          <div
            class="absolute inset-x-0 border-t border-dashed border-red-400 pointer-events-none"
            :style="{ top: `${minutes(day.closing) - startMinute}px` }"
          >
            <span class="absolute right-1 text-[10px] text-red-600"
              >Fermeture</span
            >
          </div>
          <button
            v-for="item in day.items"
            :key="item.block.key"
            type="button"
            class="forecast-block absolute overflow-hidden rounded-lg text-left text-white shadow-sm hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
            draggable="true"
            :title="`${item.block.name} · ${item.block.projectedEntrants} participants · ${forecastDateTime(item.block.start)}–${forecastDateTime(item.block.end)}`"
            :aria-label="`${item.block.name}, ${item.block.projectedEntrants} participants. Modifier les hypothèses`"
            :style="{
              top: `${item.top}px`,
              height: `${Math.max(32, item.height)}px`,
              left: `calc(${(item.lane / item.lanes) * 100}% + 3px)`,
              width: `calc(${100 / item.lanes}% - 6px)`,
              backgroundColor: forecastColor(item.block.key),
              opacity: dragged === item.block.key ? 0.5 : 1
            }"
            @click="emit('select', item.block.key)"
            @dragstart="dragStart($event, item.block.key)"
            @dragend="dragEnd"
          >
            <strong class="block text-sm">{{ item.block.name }}</strong>
            <span class="block text-xs"
              >{{ item.block.projectedEntrants }} participants</span
            >
            <span class="block text-xs"
              >{{ forecastTime(item.block.start) }} →
              {{
                forecastWall(item.block.start!).date ===
                forecastWall(item.block.end!).date
                  ? forecastTime(item.block.end)
                  : forecastDateTime(item.block.end)
              }}</span
            >
            <span v-if="item.block.delayMinutes" class="block mt-1 text-xs"
              >Départ +{{ item.block.delayMinutes }} min</span
            >
            <span
              v-if="item.block.overrunMinutes"
              class="block mt-1 text-xs font-semibold"
              >Dépassement : {{ item.block.overrunMinutes }} min</span
            >
          </button>
        </div>
        <div class="p-2 text-xs text-muted">Tables</div>
        <div
          v-for="day in days"
          :key="day.date"
          class="p-2 border-r border-default"
        >
          <div
            class="flex gap-px h-8 items-end"
            aria-label="Charge des tables par demi-heure"
          >
            <div
              v-for="slot in day.occupancy"
              :key="slot.start"
              class="flex-1 min-w-1 rounded-t"
              :class="
                slot.tables >= config.tableCount ? 'bg-red-500' : 'bg-blue-500'
              "
              :style="{
                height: `${Math.max(2, (slot.tables / config.tableCount) * 32)}px`
              }"
              :title="`${forecastTime(slot.start)} : ${slot.tables}/${config.tableCount} tables`"
            />
          </div>
          <p class="mt-1 text-xs text-muted">
            Charge par 30 min · {{ config.tableCount }} tables
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .forecast-scroll {
    overflow: auto;
    max-height: 75vh;
  }
  .forecast-grid {
    display: grid;
    min-width: 360px;
  }
  .forecast-header {
    position: sticky;
    top: 0;
    z-index: 5;
    padding: 12px 8px;
    background: var(--ui-bg);
    border-bottom: 1px solid var(--ui-border);
  }
  .forecast-day {
    background-image: repeating-linear-gradient(
      to bottom,
      transparent 0,
      transparent 29px,
      var(--ui-border) 29px,
      var(--ui-border) 30px
    );
  }
  .forecast-block {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    padding: 8px;
    cursor: grab;
    white-space: normal;
    overflow-wrap: anywhere;
  }
  .forecast-block > * {
    max-width: 100%;
  }
  .forecast-block:active {
    cursor: grabbing;
  }
</style>
