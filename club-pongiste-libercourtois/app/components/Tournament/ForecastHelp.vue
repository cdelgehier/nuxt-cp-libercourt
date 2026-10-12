<script setup lang="ts">
  defineProps<{ label: string }>()
</script>

<template>
  <UPopover arrow :content="{ align: 'end' }">
    <UButton
      type="button"
      icon="i-heroicons-information-circle"
      color="neutral"
      variant="ghost"
      size="xs"
      :aria-label="`Comprendre : ${label}`"
    />
    <template #content>
      <div class="max-w-72 p-4 text-sm text-default space-y-2">
        <p class="font-semibold">{{ label }}</p>
        <slot />
      </div>
    </template>
  </UPopover>
</template>
