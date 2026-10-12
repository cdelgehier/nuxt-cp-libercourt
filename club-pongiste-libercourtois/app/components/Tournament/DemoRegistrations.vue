<script setup lang="ts">
  const props = withDefaults(
    defineProps<{
      slug: string
      seriesId: number
      doubles: boolean
      apiBase?: string
    }>(),
    { apiBase: '/api/admin/tournois' }
  )
  const emit = defineEmits<{ refresh: [] }>()
  const toast = useToast()
  const count = ref(24)
  const busy = ref(false)

  async function fill(): Promise<void> {
    if (busy.value) return
    busy.value = true
    try {
      const result = await $fetch<{ inserted: number }>(
        `${props.apiBase}/${props.slug}/series/${props.seriesId}/demo`,
        {
          method: 'POST',
          body: { count: count.value }
        }
      )
      toast.add({
        title: `${result.inserted} ${props.doubles ? 'paires fictives ajoutées' : 'joueurs fictifs ajoutés'}`,
        color: 'success'
      })
      emit('refresh')
    } catch (error: unknown) {
      const message = (error as { data?: { message?: string } })?.data?.message
      toast.add({ title: message ?? 'Remplissage impossible', color: 'error' })
    } finally {
      busy.value = false
    }
  }
</script>

<template>
  <div
    class="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-blue-300 bg-blue-50 p-3 dark:border-blue-700 dark:bg-blue-950"
  >
    <UIcon
      name="i-heroicons-beaker"
      class="size-5 text-blue-700 dark:text-blue-300"
    />
    <div class="mr-auto">
      <p class="text-sm font-medium text-blue-900 dark:text-blue-100">
        DEV · Démonstration
      </p>
      <p class="text-xs text-blue-700 dark:text-blue-300">
        Participants fictifs, tous présents, avec des paiements variés.
      </p>
    </div>
    <UInput
      v-model.number="count"
      type="number"
      min="2"
      max="32"
      aria-label="Nombre de participants fictifs"
      class="w-20"
      :disabled="busy"
    />
    <UButton variant="outline" :loading="busy" @click="fill"
      >Remplir la série</UButton
    >
  </div>
</template>
