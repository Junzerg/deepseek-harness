/** Shipped listener configuration must resolve to validated numbers before the Host binds a socket. */
import { fileURLToPath } from 'node:url'
import { Context } from '@deepseek-ai/cordis'
import Loader from '@deepseek-ai/cordis-plugin-loader'
import { applyEntryPatches } from '@deepseek-ai/cordis-plugin-include'
import { loadOverlayPatches } from '@deepseek-ai/dsh-app-boot'
import { WebServer, type Config } from '@deepseek-ai/dsh-host-webserver'
import { expect, it, onTestFinished } from 'vitest'

it.each([
  { profile: 'desktop', port: 0, override: undefined, expected: 18743 },
  { profile: 'web', port: 43210, override: undefined, expected: 43210 },
  { profile: 'web', port: undefined, override: undefined, expected: 3080 },
  { profile: undefined, port: 0, override: undefined, expected: 0 },
  { profile: 'desktop', port: 0, override: 0, expected: 0 },
])('resolves the shipped webserver port for $profile with override $override', async ({ profile, port, override, expected }) => {
  const rows = loadOverlayPatches('listener-defaults', fileURLToPath(new URL('../cordis.patch.yml', import.meta.url)))
    .flatMap(patch => patch.insert ?? []).filter(row => row.id === 'webserver')
  expect(rows).toHaveLength(1)
  const configured = applyEntryPatches(rows, override === undefined ? [] : [{ id: 'webserver', config: { host: '127.0.0.1', port: override } }],
    (message) => { throw new Error(message) })
  const ctx = new Context()
  onTestFinished(() => ctx.fiber.dispose())
  ctx.provide('webStartup', { openBrowser: false, trustedHosts: [], ...port === undefined ? {} : { port } })
  if (profile !== undefined) ctx.provide('profileContext', {
    name: profile, dir: '/profile', patchPath: '/profile/cordis.patch.yml', installAnchor: '/profile/package.json',
    cwd: '/workspace', home: '/home', startedBundles: [], overlays: [], telemetryDisabledEnv: undefined,
  })
  ctx.baseUrl = 'file:///'
  await ctx.plugin(Loader).await()
  let resolved: Config | undefined
  ctx.loader.builtins.listener = { Config: WebServer.Config, apply: (_ctx: Context, config: Config) => { resolved = config } }
  await ctx.loader.root.update([{ ...configured[0]!, name: 'cordis:listener' }])
  await ctx.loader.await()
  const entry = ctx.loader.resolve('webserver')
  await entry.fiber?.await()
  expect(resolved?.port).toBe(expected)
})
