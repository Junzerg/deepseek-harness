// Keyless browser regression for Session feedback. A cold-seeded, settled
// transcript avoids model calls. Like and Dislike stay off the assistant
// action row; the Session Header dialog still records against the canonical log.
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import type { Browser, Page } from 'playwright'
import { chromium } from 'playwright'
import { SessionId } from '@deepseek-ai/dsh-session'
import { afterAll, beforeAll, describe, expect, it, onTestFailed } from 'vitest'
import {
  launchWebScaffold,
  seedSession, watchConsole, webSnapshotMode, type WebScaffold,
} from './scaffold.ts'
import { newEnglishPage, saveFailureShot } from './support.ts'

// Borrowed read-only: this scenario needs any settled assistant message to
// address, not a new recording (message-actions / sidebar-scrollbar pattern).
const SEED = fileURLToPath(new URL('../../../snapshots/web/seeded-history/session.v3.jsonl', import.meta.url))
const MODE = webSnapshotMode()
const SEED_ID = 'message-feedback-web-e2e'

describe('web e2e: durable per-message feedback', () => {
  let scaffold: WebScaffold
  let browser: Browser
  let page: Page
  let tripwire: ReturnType<typeof watchConsole>

  beforeAll(async () => {
    scaffold = await launchWebScaffold({})
    await seedSession(scaffold, await readFile(SEED, 'utf8'), SEED_ID)
    browser = await chromium.launch()
    page = await newEnglishPage(browser)
    tripwire = watchConsole(page)
    await page.goto(scaffold.authenticatedUrl, { waitUntil: 'load' })
    await page.waitForSelector('[class*="frame"]', { timeout: 30_000 })
  }, 120_000)

  afterAll(async () => {
    await browser?.close()
    await scaffold?.close()
  })

  /**
   * Open the seeded transcript. The first treeitem is the collapsible group
   * row; the session itself is the row beneath it. The group is already
   * expanded on a fresh load, so clicking it unconditionally would collapse it
   * and hide the session row.
   */
  async function openSeededSession(): Promise<void> {
    const groupRow = page.locator('[role="treeitem"]').first()
    await groupRow.waitFor({ timeout: 15_000 })
    if (await groupRow.getAttribute('aria-expanded') !== 'true') await groupRow.click()
    const sessionRow = page.locator('[role="treeitem"]').nth(1)
    await sessionRow.waitFor({ timeout: 15_000 })
    await sessionRow.click()
  }

  it.skipIf(MODE === 'record')('does not show like or dislike beside assistant messages', async () => {
    onTestFailed(() => saveFailureShot(page, 'web-e2e-message-feedback'))
    await openSeededSession()
    await page.getByText('DONE', { exact: true }).waitFor({ timeout: 30_000 })
    expect(await page.getByRole('button', { name: 'Good response' }).count()).toBe(0)
    expect(await page.getByRole('button', { name: 'Bad response' }).count()).toBe(0)
  })

  it.skipIf(MODE === 'record')('kept the console clean', () => {
    expect(tripwire.pageErrors).toEqual([])
    expect(tripwire.warnings).toEqual([])
  })

  it.skipIf(MODE === 'record')('opens the shared dialog from the header and records Session feedback only on submit', async () => {
    onTestFailed(() => saveFailureShot(page, 'web-e2e-header-feedback'))
    await openSeededSession()
    await page.getByText('DONE', { exact: true }).waitFor({ timeout: 30_000 })
    const agent = scaffold.ctx.agents.get(SessionId(SEED_ID))
    if (agent === undefined) throw new Error('seeded session did not attach an agent')
    const feedbackEvents = () => agent.session.snapshotEvents().filter(event => event.type.startsWith('feedback/'))
    const before = feedbackEvents().length
    const dialog = page.getByRole('dialog', { name: 'Submit feedback' })

    await page.getByRole('button', { name: 'More actions', exact: true }).click()
    await page.getByRole('menuitem', { name: 'Download session log' }).waitFor()
    await page.getByRole('menuitem', { name: 'Feedback', exact: true }).click()
    await dialog.waitFor()
    expect(await page.getByRole('menu').count()).toBe(0)
    expect(feedbackEvents()).toHaveLength(before)
    await dialog.getByRole('textbox', { name: 'Feedback details' }).fill('discarded draft')
    await dialog.getByRole('button', { name: 'Close', exact: true }).click()
    expect(feedbackEvents()).toHaveLength(before)

    await page.getByRole('button', { name: 'More actions', exact: true }).click()
    await page.getByRole('menuitem', { name: 'Feedback', exact: true }).click()
    await dialog.waitFor()
    expect(await dialog.getByRole('textbox', { name: 'Feedback details' }).inputValue()).toBe('')
    await dialog.getByRole('button', { name: 'Product features and interaction', exact: true }).click()
    await dialog.getByRole('textbox', { name: 'Feedback details' }).fill('Feedback from the Session menu.')
    await dialog.getByRole('button', { name: 'Submit', exact: true }).click()
    await expect.poll(() => dialog.count()).toBe(0)
    await page.getByRole('alert').filter({ hasText: 'Thanks for your feedback' }).waitFor()
    expect(feedbackEvents().slice(before)).toMatchObject([
      { type: 'feedback/record', data: { category: 'product-interaction', text: 'Feedback from the Session menu.' } },
    ])
    expect(tripwire.pageErrors).toEqual([])
    expect(tripwire.warnings).toEqual([])
  }, 60_000)
})
