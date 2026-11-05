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

/** Record public link targets without external URLs, fragments or parameters. */
export function navigationDestination(href: string): string | null {
  if (!href || href.startsWith('#')) return null
  try {
    const url = new URL(href, SITE_ORIGIN)
    return url.origin === SITE_ORIGIN && isPublicPage(url.pathname)
      ? url.pathname
      : null
  } catch {
    return null
  }
}

/** Count official blank FFTT documents without recording URL parameters. */
export function documentDestination(href: string): string | null {
  try {
    const url = new URL(href)
    if (
      url.protocol !== 'https:' ||
      !['fftt.com', 'www.fftt.com'].includes(url.hostname)
    ) {
      return null
    }
    return /^\/doc\/administratif\/(?:documents\/[^/]+\.pdf|telechargement\.html)$/i.test(
      url.pathname
    )
      ? url.pathname
      : null
  } catch {
    return null
  }
}

/** Keep private areas excluded even when their requested page is missing. */
function isPrivatePage(path: string): boolean {
  return (
    /^\/(?:admin(?:-fftt)?|auth|api|login)(?:\/|$)/i.test(path) ||
    (path.startsWith('/tournois/') && !isPublicPage(path))
  )
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
    if (url.origin !== SITE_ORIGIN) return null
    const missingPage = payload.name === 'page-not-found'
    if (
      missingPage ? isPrivatePage(url.pathname) : !isPublicPage(url.pathname)
    ) {
      return null
    }

    const event = { ...payload }
    delete event.id
    if (missingPage) event.title = 'Page not found'
    return {
      ...event,
      url: `${SITE_ORIGIN}${missingPage ? '/404' : url.pathname}`,
      referrer: publicReferrer(payload.referrer)
    }
  } catch {
    return null
  }
}
