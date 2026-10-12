// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import ts from 'typescript'
import { afterEach, expect, it, vi } from 'vitest'

const require = createRequire(import.meta.url)
const nuxtRequire = createRequire(require.resolve('nuxt/package.json'))
const { parse, compileScript } = nuxtRequire('vue/compiler-sfc')
const { createApp, h, Suspense, nextTick, ref, computed } = nuxtRequire('vue')

// Compile the real page so this test also exercises its template click handler.
const filename = 'app/pages/tournois/index.vue'
const { descriptor } = parse(readFileSync(filename, 'utf8'), { filename })
const script = compileScript(descriptor, {
  id: 'tournament-share-test',
  inlineTemplate: true
})
const compiled = ts.transpileModule(script.content, {
  compilerOptions: { module: ts.ModuleKind.CommonJS }
}).outputText

let unmount: (() => void) | undefined

afterEach(function () {
  unmount?.()
  document.body.replaceChildren()
  vi.unstubAllGlobals()
})

async function mountPage(writeText: Clipboard['writeText']) {
  vi.stubGlobal('ref', ref)
  vi.stubGlobal('computed', computed)
  vi.stubGlobal('useSeoMeta', function () {})
  vi.stubGlobal('useRequestURL', function () {
    return new URL('https://cplibercourt.netlify.app/tournois')
  })
  vi.stubGlobal('formatDateRange', function () {
    return '17 octobre 2026'
  })
  vi.stubGlobal('useFetch', async function () {
    return {
      data: ref([
        { id: 1, name: 'Démo', slug: 'demo-tournoi', seriesCount: 1 },
        { id: 2, name: 'Autre tournoi', slug: 'autre-tournoi', seriesCount: 1 }
      ]),
      pending: ref(false)
    }
  })
  vi.stubGlobal('navigator', { clipboard: { writeText } })

  const exports = { default: undefined }
  new Function('require', 'exports', compiled)(nuxtRequire, exports)
  const app = createApp({ render: () => h(Suspense, () => h(exports.default)) })
  const errors: unknown[] = []
  app.config.errorHandler = function (error: unknown) {
    errors.push(error)
  }
  app.component('NuxtLink', {
    render() {
      return h('a', this.$slots.default?.())
    }
  })
  app.component('UCard', {
    render() {
      return h('div', [this.$slots.header?.(), this.$slots.default?.()])
    }
  })
  app.component('UModal', {
    props: ['open'],
    render() {
      return this.open ? h('div', this.$slots.content?.()) : null
    }
  })
  app.component('UButton', {
    render() {
      return h('button', this.$slots.default?.())
    }
  })
  app.component('UIcon', { render: () => null })
  app.component('UBadge', { render: () => null })
  app.component('USkeleton', { render: () => null })
  app.mount(document.body.appendChild(document.createElement('div')))
  unmount = () => app.unmount()
  await new Promise<void>(resolve => setTimeout(resolve, 0))

  async function click(label: string) {
    const button = [...document.querySelectorAll('button')].find(
      button => button.textContent?.trim() === label
    )
    expect(button, `Button ${label} should be visible`).toBeDefined()
    button!.click()
    await nextTick()
  }

  document.querySelector<HTMLButtonElement>('[title="Partager"]')!.click()
  await nextTick()
  return { click, errors }
}

it('copies the tournament URL when the share button is clicked', async function () {
  let clipboard = ''
  const page = await mountPage(async function (text) {
    clipboard = text
  })

  await page.click('Copier le lien')

  expect(clipboard).toBe(
    'https://cplibercourt.netlify.app/tournois/demo-tournoi'
  )
  expect(page.errors).toEqual([])
  expect(document.body.textContent).toContain('Lien copié')
})

it('explains a clipboard refusal without displaying success', async function () {
  const page = await mountPage(async function () {
    throw new DOMException('Clipboard denied', 'NotAllowedError')
  })

  await page.click('Copier le lien')

  expect(document.querySelector('[role="alert"]')?.textContent).toContain(
    'La copie a échoué'
  )
  expect(document.body.textContent).not.toContain('Lien copié')
  expect(page.errors).toEqual([])
})

it('resets the confirmation and copies the next tournament URL', async function () {
  let clipboard = ''
  const page = await mountPage(async function (text) {
    clipboard = text
  })
  await page.click('Copier le lien')

  document.querySelectorAll<HTMLButtonElement>('[title="Partager"]')[1]!.click()
  await nextTick()
  expect(document.body.textContent).not.toContain('Lien copié')
  await page.click('Copier le lien')

  expect(clipboard).toBe(
    'https://cplibercourt.netlify.app/tournois/autre-tournoi'
  )
  expect(page.errors).toEqual([])
})
