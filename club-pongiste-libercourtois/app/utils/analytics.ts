const SITE_ORIGIN = 'https://cplibercourt.netlify.app'
const PUBLIC_PAGES = new Set([
  '/',
  '/actualites',
  '/club',
  '/licencies',
  '/equipes',
  '/calendrier',
  '/tournois',
  '/horaires-tarifs',
  '/faq',
  '/contact',
  '/mentions-legales',
  '/politique-confidentialite'
])

/** Limit analytics to public pages, including tournament landing pages. */
function isPublicPage(path: string): boolean {
  return PUBLIC_PAGES.has(path) || /^\/tournois\/[^/]+\/?$/.test(path)
}

/** Keep the source website without sending private paths or URL parameters. */
function publicReferrer(value: unknown): string {
  if (typeof value !== 'string' || !value) return ''

  try {
    const url = new URL(value, SITE_ORIGIN)
    if (!['http:', 'https:'].includes(url.protocol)) return ''
    if (url.origin !== SITE_ORIGIN) return `${url.origin}/`
    return isPublicPage(url.pathname) ? url.pathname : ''
  } catch {
    return ''
  }
}

/** Send public page views and click events without query strings or identities. */
export function filterAnalyticsPayload(
  type: string,
  payload: Record<string, unknown>
): Record<string, unknown> | null {
  if (type !== 'event' || typeof payload.url !== 'string') return null

  try {
    const url = new URL(payload.url, SITE_ORIGIN)
    if (url.origin !== SITE_ORIGIN || !isPublicPage(url.pathname)) return null

    const event = { ...payload }
    delete event.id
    return {
      ...event,
      url: `${SITE_ORIGIN}${url.pathname}`,
      referrer: publicReferrer(payload.referrer)
    }
  } catch {
    return null
  }
}
