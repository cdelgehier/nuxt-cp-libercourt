import { describe, expect, it } from 'vitest'
import {
  filterAnalyticsPayload,
  documentDestination,
  navigationDestination
} from '../../../app/utils/analytics'

describe('public navigation clicks', () => {
  it.each(['/actualites', '/licencies', '/equipes', '/calendrier', '/faq'])(
    'keeps the public destination %s without URL parameters',
    function (path) {
      expect(
        navigationDestination(`${path}?email=private@example.com#secret`)
      ).toBe(path)
    }
  )

  it.each([
    '#section',
    '/admin',
    '/auth/login',
    '/tournois/test/inscription',
    'https://example.com/faq',
    'mailto:private@example.com'
  ])('ignores private, external and in-page links: %s', function (href) {
    expect(navigationDestination(href)).toBeNull()
  })
})

describe('public document clicks', () => {
  it('keeps the official document path without its parameters', function () {
    expect(
      documentDestination(
        'https://www.fftt.com/doc/administratif/documents/25-2-licence.pdf?token=secret#page=1'
      )
    ).toBe('/doc/administratif/documents/25-2-licence.pdf')
  })

  it('counts the official download portal used as a fallback', function () {
    expect(
      documentDestination(
        'https://www.fftt.com/doc/administratif/telechargement.html'
      )
    ).toBe('/doc/administratif/telechargement.html')
  })

  it.each([
    'https://example.com/doc/administratif/documents/licence.pdf',
    'https://www.fftt.com/account/private.pdf',
    '/api/private.pdf',
    'javascript:alert(1)',
    'https://www.fftt.com/doc/administratif/documents/page.html'
  ])('does not collect unrelated or private documents: %s', function (href) {
    expect(documentDestination(href)).toBeNull()
  })
})

describe('public website analytics', () => {
  it.each(['/', '/contact', '/tournois', '/tournois/tournoi-annuel'])(
    'keeps a public page view for %s',
    url => {
      expect(filterAnalyticsPayload('event', { url })).toMatchObject({
        url: `https://cplibercourt.netlify.app${url}`
      })
    }
  )

  it.each([
    '/admin',
    '/admin/tournois',
    '/auth/oidc/callback?code=secret',
    '/login',
    '/tournois/tournoi-annuel/ja',
    '/tournois/tournoi-annuel/ja/login',
    '/tournois/tournoi-annuel/inscription',
    'https://preview.example.com/contact'
  ])('does not send private or preview page views for %s', url => {
    expect(filterAnalyticsPayload('event', { url })).toBeNull()
  })

  it('removes queries and fragments while preserving the referring website', () => {
    expect(
      filterAnalyticsPayload('event', {
        url: '/contact?email=private@example.com#secret',
        referrer: 'https://example.com/search?email=private@example.com#secret',
        name: 'contact-email'
      })
    ).toEqual({
      url: 'https://cplibercourt.netlify.app/contact',
      referrer: 'https://example.com/',
      name: 'contact-email'
    })
  })

  it('does not send a private page as the referrer of a public page', () => {
    expect(
      filterAnalyticsPayload('event', {
        url: '/',
        referrer: '/admin/tournois?token=secret'
      })
    ).toMatchObject({ referrer: '' })
  })

  it('does not send identity updates', () => {
    expect(
      filterAnalyticsPayload('identify', { url: '/', id: 'a-member' })
    ).toBeNull()
  })

  it('counts missing pages without sending the unknown path or its parameters', () => {
    expect(
      filterAnalyticsPayload('event', {
        url: '/missing/private@example.com?token=secret',
        title: '404 - /missing/private@example.com?token=secret',
        referrer: '/faq?token=secret',
        name: 'page-not-found'
      })
    ).toEqual({
      url: 'https://cplibercourt.netlify.app/404',
      title: 'Page not found',
      referrer: '/faq',
      name: 'page-not-found'
    })
  })

  it.each([
    '/admin/missing',
    '/admin-fftt/missing',
    '/auth/missing',
    '/api/missing',
    '/login',
    '/tournois/test/ja/missing',
    '/tournois/test/inscription/missing'
  ])('does not track a missing private page: %s', function (url) {
    expect(
      filterAnalyticsPayload('event', { url, name: 'page-not-found' })
    ).toBeNull()
  })
})
