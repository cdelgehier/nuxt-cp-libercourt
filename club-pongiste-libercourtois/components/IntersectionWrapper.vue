<template>
  <div v-if="isVisible || !lazy" :class="containerClass">
    <slot />
  </div>
  <div
    v-else
    ref="placeholder"
    :class="[containerClass, placeholderClass]"
    :style="placeholderStyle"
  >
    <slot name="placeholder">
      <div v-if="showPlaceholder" class="lazy-placeholder">
        <div class="lazy-spinner" />
        <p v-if="placeholderText" class="lazy-text">{{ placeholderText }}</p>
      </div>
    </slot>
  </div>
</template>

<script setup lang="ts">
interface Props {
  /** Enable lazy loading */
  lazy?: boolean
  /** CSS classes for container */
  containerClass?: string
  /** CSS classes for placeholder */
  placeholderClass?: string
  /** Inline styles for placeholder */
  placeholderStyle?: Record<string, string>
  /** Show default loading placeholder */
  showPlaceholder?: boolean
  /** Text to show in placeholder */
  placeholderText?: string
  /** Intersection observer root margin */
  rootMargin?: string
  /** Intersection observer threshold */
  threshold?: number
}

const props = withDefaults(defineProps<Props>(), {
  lazy: true,
  containerClass: '',
  placeholderClass: '',
  placeholderStyle: () => ({}),
  showPlaceholder: true,
  placeholderText: '',
  rootMargin: '50px',
  threshold: 0.1,
})

const emit = defineEmits<{
  visible: []
  hidden: []
}>()

const isVisible = ref(false)
const placeholder = ref<HTMLElement>()

const observer = ref<IntersectionObserver>()

onMounted(() => {
  if (!props.lazy) {
    isVisible.value = true
    return
  }

  if (placeholder.value && 'IntersectionObserver' in window) {
    observer.value = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            isVisible.value = true
            emit('visible')
            observer.value?.disconnect()
          }
        })
      },
      {
        rootMargin: props.rootMargin,
        threshold: props.threshold,
      }
    )

    observer.value.observe(placeholder.value)
  } else {
    // Fallback for browsers without IntersectionObserver
    isVisible.value = true
  }
})

onUnmounted(() => {
  observer.value?.disconnect()
})
</script>

<style scoped>
.lazy-placeholder {
  @apply flex flex-col items-center justify-center p-8 text-gray-500;
  min-height: 200px;
}

.lazy-spinner {
  @apply w-8 h-8 border-2 border-gray-300 border-t-club-green rounded-full animate-spin mb-4;
}

.lazy-text {
  @apply text-sm text-center;
}

/* Dark mode support */
.dark .lazy-placeholder {
  @apply text-gray-400;
}

.dark .lazy-spinner {
  @apply border-gray-600 border-t-club-green;
}
</style>