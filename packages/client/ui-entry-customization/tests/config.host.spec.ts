/** Host configuration projects entry customization controls into browser pages. */
import { Context } from '@deepseek-ai/cordis'
import type { IndexInjection, WebServer } from '@deepseek-ai/dsh-host-webserver'
import { expect, it, onTestFinished } from 'vitest'
import { Config, ENTRY_CUSTOMIZATION_CONFIG_GLOBAL } from '../src/config.ts'
import * as host from '../src/index.ts'

/** The Peer an index render speaks for; this listener reads no field of it. */
const PAGE_PEER = { principal: { kind: 'owner' } } as Parameters<WebServer['renderIndex']>[1]

it('defaults both external actions on and validates explicit deployment controls', () => {
  expect(host.Config).toBe(Config)
  expect(Config({})).toEqual({ showBrowsePlugins: true, showCreatePlugin: true })
  expect(Config({ showBrowsePlugins: false, showCreatePlugin: false }))
    .toEqual({ showBrowsePlugins: false, showCreatePlugin: false })
})

it('embeds entry customization controls in browser pages and withdraws them on disposal', async () => {
  const ctx = new Context()
  onTestFinished(async () => { await ctx.fiber.dispose() })
  const config = Config({ showBrowsePlugins: false, showCreatePlugin: false })
  const fiber = ctx.plugin(host, config)
  await fiber.await()
  const rows: IndexInjection[] = []
  ctx.emit('webserver/index-inject', rows, PAGE_PEER)
  expect(rows).toEqual([{ kind: 'global', name: ENTRY_CUSTOMIZATION_CONFIG_GLOBAL, value: config }])
  await fiber.dispose()
  const after: IndexInjection[] = []
  ctx.emit('webserver/index-inject', after, PAGE_PEER)
  expect(after).toEqual([])
})
