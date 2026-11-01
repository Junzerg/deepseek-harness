/** The docked composer does not show context or token statistics. */
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { describe, expect, it } from 'vitest'
import { launchWebScaffold, selectedSessionFixture, watchConsole, webSnapshotMode } from './scaffold.ts'
import { connectFreshWorkspace, newEnglishPage } from './support.ts'

const FIXTURE = fileURLToPath(new URL('../../../snapshots/web/fresh-round-trip/session.v3.jsonl', import.meta.url))
const NO_CHAT = fileURLToPath(new URL('./fixtures/context-meter-no-chat.patch.yml', import.meta.url))

describe.skipIf(webSnapshotMode() === 'record')('web e2e: context details placement', () => {
  it.each([true, false])('omits the usage strip (Chat statistics: %s)', async (withStats) => {
    const fixture = await selectedSessionFixture(FIXTURE, false)
    const scaffold = await launchWebScaffold({
      replayFixture: fixture,
      compareReplaySession: false,
      paceMs: 5,
      ...withStats ? {} : { extraOverlayPath: NO_CHAT },
    })
    try {
      const browser = await chromium.launch()
      try {
        const page = await newEnglishPage(browser)
        const tripwire = watchConsole(page)
        await page.goto(scaffold.authenticatedUrl, { waitUntil: 'load' })
        await connectFreshWorkspace(page, scaffold.workspaceCwd)
        await page.locator('[data-composer-card]').waitFor()
        expect(await page.getByRole('button', { name: /% of context used$/ }).count()).toBe(0)
        expect(await page.getByRole('button', { name: /tok · Cache hit/ }).count()).toBe(0)
        expect(await page.locator('[data-composer-dock]').count()).toBe(0)
        expect(tripwire.pageErrors).toEqual([])
        expect(tripwire.warnings).toEqual([])
      } finally {
        await browser.close()
      }
    } finally {
      await scaffold.close()
    }
  })
})
