<template>
  <picture>
    <!-- WebP sources for modern browsers -->
    <source
      v-if="webpSrcSet"
      :srcset="webpSrcSet"
      :sizes="sizes"
      type="image/webp"
    />

    <!-- Fallback to optimized JPEG/PNG -->
    <img
      :src="fallbackSrc"
      :srcset="fallbackSrcSet"
      :sizes="sizes"
      :alt="alt"
      :class="imgClass"
      :loading="loading"
      :decoding="decoding"
      @load="onLoad"
      @error="onError"
    />
  </picture>
</template>

<script setup lang="ts">
interface Props {
  /** Image name without extension (e.g., 'logo-club') */
  name: string;
  /** Image alt text */
  alt: string;
  /** Original file extension for fallback */
  ext?: "jpg" | "png";
  /** CSS classes for the img element */
  class?: string;
  /** Sizes attribute for responsive images */
  sizes?: string;
  /** Loading strategy */
  loading?: "lazy" | "eager";
  /** Decoding hint */
  decoding?: "async" | "sync" | "auto";
  /** Available breakpoints */
  breakpoints?: number[];
}

const props = withDefaults(defineProps<Props>(), {
  ext: "jpg",
  class: "",
  sizes: "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  loading: "lazy",
  decoding: "async",
  breakpoints: () => [400, 800, 1200, 1600],
});

const emit = defineEmits<{
  load: [event: Event];
  error: [event: Event];
}>();

// Generate WebP srcset for modern browsers
const webpSrcSet = computed(() => {
  return props.breakpoints
    .map((size) => `/images/optimized/${props.name}-${size}w.webp ${size}w`)
    .join(", ");
});

// Generate fallback srcset for older browsers
const fallbackSrcSet = computed(() => {
  return props.breakpoints
    .map(
      (size) =>
        `/images/optimized/${props.name}-${size}w-optimized.${props.ext} ${size}w`,
    )
    .join(", ");
});

// Fallback src for browsers that don't support srcset
const fallbackSrc = computed(() => {
  return `/images/optimized/${props.name}-optimized.${props.ext}`;
});

const imgClass = computed(() => props.class);

function onLoad(event: Event) {
  emit("load", event);
}

function onError(event: Event) {
  // If optimized image fails, try original
  const img = event.target as HTMLImageElement;
  const originalSrc = `/images/${props.name}.${props.ext}`;

  if (img.src !== originalSrc) {
    console.warn(
      `Failed to load optimized image: ${img.src}, falling back to original`,
    );
    img.src = originalSrc;
  }

  emit("error", event);
}
</script>
