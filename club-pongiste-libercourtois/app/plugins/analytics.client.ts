import type { Ref } from 'vue'
import {
  documentDestination,
  filterAnalyticsPayload,
  navigationDestination
} from '../utils/analytics'

declare global {
  interface Window {
    clubAnalyticsBeforeSend: typeof filterAnalyticsPayload
    umami?: {
      track: (_name: string, _data?: Record<string, string>) => void
    }
  }
}

let lastNotFoundPath = ''

/** Count a public link before Nuxt changes the current route. */
function trackPublicLink(event: MouseEvent): void {
  if (event.button !== 0 || !(event.target instanceof Element)) return
  const link = event.target.closest('a[href]')
  if (!link || link.hasAttribute('data-umami-event')) return
  const href = link.getAttribute('href') || ''
  const destination = navigationDestination(href)
  if (destination) {
    window.umami?.track('navigation', { destination })
    return
  }
  const document = documentDestination(href)
  if (document) window.umami?.track('document-download', { document })
}

/** Report each displayed 404 once, including errors raised after SPA navigation. */
function trackNotFound(
  error: { statusCode?: number } | null | undefined
): void {
  if (error?.statusCode !== 404) {
    lastNotFoundPath = ''
    return
  }
  if (!window.umami || lastNotFoundPath === window.location.pathname) return
  lastNotFoundPath = window.location.pathname
  window.umami.track('page-not-found')
}

/** Wait for the tracker before reporting an initial server-rendered error. */
function trackInitialError(
  error: Ref<{ statusCode?: number } | undefined>
): void {
  trackNotFound(error.value)
}

export default defineNuxtPlugin(function setupAnalytics() {
  if (
    process.env.NODE_ENV !== 'production' ||
    window.location.hostname !== 'cplibercourt.netlify.app'
  ) {
    return
  }

  window.clubAnalyticsBeforeSend = filterAnalyticsPayload
  document.removeEventListener('click', trackPublicLink, true)
  document.addEventListener('click', trackPublicLink, true)
  const error = useError()
  watch(error, trackNotFound, { immediate: true })
  useHead({
    script: [
      {
        key: 'umami',
        src: 'https://stats.jackruby.qzz.io/script.js',
        defer: true,
        onload: trackInitialError.bind(null, error),
        'data-website-id': 'ebd3012a-ab5b-467c-aa96-fb588890ddca',
        'data-domains': 'cplibercourt.netlify.app',
        'data-do-not-track': 'true',
        'data-exclude-search': 'true',
        'data-exclude-hash': 'true',
        'data-before-send': 'clubAnalyticsBeforeSend'
      }
    ]
  })
})
