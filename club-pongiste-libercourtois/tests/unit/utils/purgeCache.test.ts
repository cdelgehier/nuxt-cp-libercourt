import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { H3Event } from 'h3'

const { updateConfigStub } = vi.hoisted(function () {
  return { updateConfigStub: vi.fn() }
})

vi.mock('~~/server/domains/club/service', function () {
  return { updateConfig: updateConfigStub }
})
vi.mock('~~/server/utils/purgeCache', function () {
  return import('../../../server/utils/purgeCache')
})

beforeEach(function () {
  vi.stubGlobal('defineEventHandler', function (handler: unknown) {
    return handler
  })
  vi.stubGlobal('readBody', vi.fn().mockResolvedValue({ name: 'Club corrigé' }))
  updateConfigStub.mockResolvedValue({ id: 1, name: 'Club corrigé' })
})

afterEach(function () {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  vi.resetModules()
})

describe('club configuration cache purge', function () {
  it('purges only config and club tags after saving on Netlify', async function () {
    vi.stubEnv('NETLIFY', 'true')
    vi.stubEnv('NETLIFY_LOCAL', '')
    vi.stubEnv('SITE_ID', 'local-test-site')
    vi.stubEnv('NETLIFY_PURGE_API_TOKEN', 'local-test-token')
    const requests: unknown[] = []
    vi.stubGlobal('fetch', async function (_url: string, options: RequestInit) {
      requests.push(JSON.parse(String(options.body)))
      return new Response(null, { status: 202 })
    })
    const { default: saveConfig } = await import(
      '../../../server/api/admin/config.put'
    )
    expect(await saveConfig({} as H3Event)).toEqual({
      id: 1,
      name: 'Club corrigé'
    })
    expect(requests).toEqual([
      { site_id: 'local-test-site', cache_tags: ['config', 'club'] }
    ])
  })

  it('does not call Netlify when saving locally', async function () {
    vi.stubEnv('NETLIFY', '')
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    const { default: saveConfig } = await import(
      '../../../server/api/admin/config.put'
    )
    expect(await saveConfig({} as H3Event)).toEqual({
      id: 1,
      name: 'Club corrigé'
    })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('keeps the saved result when the CDN purge fails', async function () {
    vi.stubEnv('NETLIFY', 'true')
    vi.stubEnv('NETLIFY_LOCAL', '')
    vi.stubEnv('SITE_ID', 'local-test-site')
    vi.stubEnv('NETLIFY_PURGE_API_TOKEN', 'local-test-token')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 503 }))
    )
    const errorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(function () {})
    const { default: saveConfig } = await import(
      '../../../server/api/admin/config.put'
    )
    expect(await saveConfig({} as H3Event)).toEqual({
      id: 1,
      name: 'Club corrigé'
    })
    expect(errorSpy).toHaveBeenCalled()
  })
})
