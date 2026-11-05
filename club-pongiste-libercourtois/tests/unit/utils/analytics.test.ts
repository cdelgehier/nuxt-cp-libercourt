import { describe, expect, it } from 'vitest'
import { filterAnalyticsPayload } from '../../../app/utils/analytics'

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
})
