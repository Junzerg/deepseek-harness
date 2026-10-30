/** Unsupported browser languages use English and offer only the shipped languages. */
import { chromium, type Browser } from 'playwright'
import { expect, it, onTestFailed, onTestFinished } from 'vitest'
import { launchWebScaffold, watchConsole, type WebScaffold } from './scaffold.ts'
import { openSettings, saveFailureShot } from './support.ts'

it.each(['ja-JP', 'es-MX', 'fr-CA', 'de-DE', 'ru-RU', 'pt-BR'])(
  'falls back to English for browser locale %s', async (tag) => {
    const resources: { scaffold?: WebScaffold; browser?: Browser } = {}
    onTestFinished(async () => {
      try { await resources.browser?.close() } finally { await resources.scaffold?.close() }
    })
    const scaffold = await launchWebScaffold()
    resources.scaffold = scaffold
    const browser = await chromium.launch()
    resources.browser = browser
    const page = await browser.newPage({ locale: tag, viewport: { width: 1440, height: 960 } })
    const tripwire = watchConsole(page)
    onTestFailed(() => saveFailureShot(page, `unsupported-locale-${tag}`))
    await page.goto(scaffold.authenticatedUrl)
    await expect.poll(() => page.evaluate(() => document.documentElement.lang)).toBe('en')
    await openSettings(page, 'en')
    const dialog = page.getByRole('dialog', { name: 'Settings', exact: true })
    await dialog.getByRole('button', { name: 'English', exact: true }).click()
    expect(await page.getByRole('menuitem').allTextContents()).toEqual(['中文', 'English'])
    expect(tripwire.warnings).toEqual([])
    expect(tripwire.pageErrors).toEqual([])
  },
)
