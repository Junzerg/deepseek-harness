/** The internal Web profile omits external plugin discovery and authoring controls. */
import { fileURLToPath } from 'node:url'
import { chromium, type Browser, type Page } from 'playwright'
import { afterAll, beforeAll, describe, expect, it, onTestFailed } from 'vitest'
import { launchWebScaffold, watchConsole, type WebScaffold, type WebConsoleTripwire } from './scaffold.ts'
import { newEnglishPage, saveFailureShot } from './support.ts'

describe('internal navigation entry customization', () => {
  let scaffold: WebScaffold | undefined
  let browser: Browser | undefined
  let page: Page
  let tripwire: WebConsoleTripwire

  beforeAll(async () => {
    scaffold = await launchWebScaffold({
      extraOverlayPath: fileURLToPath(new URL('./pin-browse-picker.overlay.yml', import.meta.url)),
    })
    browser = await chromium.launch()
    page = await newEnglishPage(browser)
    tripwire = watchConsole(page)
    await page.goto(scaffold.authenticatedUrl, { waitUntil: 'load' })
  })

  afterAll(async () => {
    try { await browser?.close() } finally { await scaffold?.close() }
  })

  it('keeps curated plugins available without browsing or creation entries after reload', async () => {
    onTestFailed(() => saveFailureShot(page, 'entry-customization'))
    const nav = page.getByRole('navigation', { name: 'Global panels' })
    const tasks = nav.getByRole('button', { name: 'Automation tasks', exact: true })
    const more = nav.getByRole('button', { name: 'More', exact: true })
    const plugins = nav.getByRole('button', { name: 'Plugins', exact: true })
    await tasks.waitFor()
    await tasks.click()
    await page.getByRole('heading', { name: 'Automation tasks', exact: true }).waitFor()
    for (const reload of [false, true]) {
      if (reload) {
        await page.reload({ waitUntil: 'load' })
        await tasks.click()
        await page.getByRole('heading', { name: 'Automation tasks', exact: true }).waitFor()
      }
      await tasks.waitFor()
      await plugins.waitFor()
      expect(await more.count()).toBe(0)
      expect(await page.getByRole('menuitem', { name: 'Browse other plugins', exact: true }).count()).toBe(0)
      expect(await page.getByRole('menuitem', { name: 'Create your plugin', exact: true }).count()).toBe(0)
      expect(await tasks.getAttribute('aria-current')).toBe('page')
    }
    expect(tripwire.pageErrors).toEqual([])
    expect(tripwire.warnings).toEqual([])
  })
})
