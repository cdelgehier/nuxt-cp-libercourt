import { filterAnalyticsPayload } from '../utils/analytics'

declare global {
  interface Window {
    clubAnalyticsBeforeSend: typeof filterAnalyticsPayload
  }
}

export default defineNuxtPlugin(function setupAnalytics() {
  if (
    process.env.NODE_ENV !== 'production' ||
    window.location.hostname !== 'cplibercourt.netlify.app'
  ) {
    return
  }

  window.clubAnalyticsBeforeSend = filterAnalyticsPayload
  useHead({
    script: [
      {
        key: 'umami',
        src: 'https://stats.jackruby.qzz.io/script.js',
        defer: true,
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
