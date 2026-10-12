import { describe, expect, it } from 'vitest'
import { JSDOM } from 'jsdom'
import { readFileSync } from 'node:fs'
import { registrationPrintDocument } from '../../../app/utils/registration-print'

describe('registration print document', function () {
  it('keeps the whole list in a separate landscape document', function () {
    const markup =
      '<section><h1>Tournoi &amp; inscriptions</h1><table><tbody><tr><td>Martin</td><td>×</td></tr></tbody></table></section>'
    const styles = readFileSync(
      new URL(
        '../../../app/assets/css/tournament-registrations-print.css',
        import.meta.url
      ),
      'utf8'
    )
    const document = new JSDOM(registrationPrintDocument(markup, styles)).window
      .document

    expect(document.querySelector('h1')!.textContent).toBe(
      'Tournoi & inscriptions'
    )
    expect(document.querySelector('tbody')!.textContent).toBe('Martin×')
    expect(document.querySelector('style')!.textContent).toMatch(
      /@page\s*\{\s*size:\s*A4 landscape/
    )
    expect(document.querySelector('style')!.textContent).not.toMatch(
      /page:\s*tournament-/
    )
    expect(document.querySelector('script')).toBeNull()
  })
})
