// Fix for Vue TypeScript conflicts
// This file helps resolve Vue type definition conflicts in Nuxt 3

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// Augment global Vue types to prevent conflicts
declare global {
  const definePageMeta: typeof import('#app/composables/router')['definePageMeta']
  const navigateTo: typeof import('#app/composables/router')['navigateTo']
  const useRoute: typeof import('#app/composables/router')['useRoute']
  const useRouter: typeof import('#app/composables/router')['useRouter']
  const useHead: typeof import('#app/composables/head')['useHead']
}

export {}
