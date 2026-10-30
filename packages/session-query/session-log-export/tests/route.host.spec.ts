import { Context } from '@deepseek-ai/cordis'
import { Decrypter, generateX25519Identity, identityToRecipient } from 'age-encryption'
import { HostConnectionService } from '@deepseek-ai/dsh-client-connection'
import type { BrowserAuth } from '@deepseek-ai/dsh-client-connection/src/browser-auth.ts'
import { SESSION_FORMAT_VERSION } from '@deepseek-ai/dsh-session'
import type { SessionHeader, SessionId } from '@deepseek-ai/dsh-session'
import type { SessionHandle } from '@deepseek-ai/dsh-session-persistence'
import { strFromU8, unzipSync } from 'fflate'
import { describe, expect, it } from 'vitest'
import {
  Config,
  SESSION_LOG_FILENAME,
  SESSION_LOG_EXPORT_PATH,
  apply,
  inject,
} from '../src/index.ts'

const sid = (value: string): SessionId => value as SessionId

function readHandle(id: string): SessionHandle {
  const header: SessionHeader = {
    version: SESSION_FORMAT_VERSION,
    id: sid(id),
    createdAt: 1,
    isSeeded: false,
    cwd: '/workspace',
    delegationDepth: 0,
  }
  return {
    id: header.id,
    header,
    access: 'read',
    read: async () => ({ eventState: 'detached', events: [] }),
    close: async () => {},
  } as unknown as SessionHandle
}

async function mounted(withServices: boolean, config: import('../src/index.ts').Config = {},
  trace?: (id: SessionId, signal?: AbortSignal) => Promise<{ descendants: never[] }>): Promise<{
  readonly connection: HostConnectionService
  readonly dispose: () => Promise<void>
}> {
  const ctx = new Context()
  ctx.provide('commands', { register: () => () => {} } as never)
  if (withServices) {
    ctx.provide('sessionQuery', {
      traceSession: trace ?? (async () => ({ descendants: [] })),
    } as never)
    ctx.provide('sessionPersistence', {
      stat: async (id: SessionId) => ({ header: readHandle(String(id)).header }),
      open: async (id: SessionId) => readHandle(String(id)),
    } as never)
    ctx.provide('attachments', {
      readImage: async () => { throw new Error('fixture has no images') },
    } as never)
  }
  const connection = new HostConnectionService(ctx, [], {} as BrowserAuth)
  const fiber = ctx.plugin({ inject: [...inject], apply }, config)
  await fiber
  return { connection, dispose: () => fiber.dispose() }
}

describe('Session log export Fetch route', () => {
  it('registers one GET/HEAD route and removes it with the plugin fiber', async () => {
    const { connection, dispose } = await mounted(true)
    const shared = connection.createSharedFetchHandler('/api')

    const response = await shared.fetch(new Request(
      `http://host${SESSION_LOG_EXPORT_PATH}?sessionId=session-1`,
    ), connection.browserPeer)
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('application/zip')
    const files = unzipSync(new Uint8Array(await response.arrayBuffer()))
    expect(strFromU8(files[SESSION_LOG_FILENAME] as Uint8Array)).toContain('"id":"session-1"')

    const head = await shared.fetch(new Request(
      `http://host${SESSION_LOG_EXPORT_PATH}?sessionId=session-1`, { method: 'HEAD' },
    ), connection.browserPeer)
    expect(head.status).toBe(200)
    expect(head.body).toBeNull()

    await dispose()
    expect((await shared.fetch(new Request(
      `http://host${SESSION_LOG_EXPORT_PATH}?sessionId=session-1`,
    ), connection.browserPeer)).status).toBe(404)
  })

  it('validates the query before reporting missing export services', async () => {
    const { connection, dispose } = await mounted(false)
    const shared = connection.createSharedFetchHandler('/api')
    expect((await shared.fetch(new Request(`http://host${SESSION_LOG_EXPORT_PATH}`), connection.browserPeer)).status).toBe(400)
    expect((await shared.fetch(new Request(
      `http://host${SESSION_LOG_EXPORT_PATH}?sessionId=session-1&includeDescendants=1`,
    ), connection.browserPeer)).status).toBe(400)
    expect((await shared.fetch(new Request(
      `http://host${SESSION_LOG_EXPORT_PATH}?sessionId=session-1`,
    ), connection.browserPeer)).status).toBe(500)
    await dispose()
  })

  it('validates the compression level', () => {
    expect(Config({})).toEqual({ compressionLevel: 6 })
    expect(Config({ compressionLevel: 0 })).toEqual({ compressionLevel: 0 })
    expect(Config({ compressionLevel: 9 })).toEqual({ compressionLevel: 9 })
    for (const compressionLevel of [-1, 10, 1.5]) {
      expect(() => Config({ compressionLevel } as never)).toThrow()
    }
  })
})

it('encrypts the complete ZIP for the recipient and preserves encrypted HEAD metadata', async () => {
  const identity = await generateX25519Identity()
  const { connection, dispose } = await mounted(true, { encryptionRecipient: await identityToRecipient(identity) })
  try {
    const fetch = connection.createSharedFetchHandler('/api')
    const url = `http://host${SESSION_LOG_EXPORT_PATH}?sessionId=encrypted-session&includeDescendants=true`
    const response = await fetch.fetch(new Request(url), connection.browserPeer)
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('application/octet-stream')
    expect(response.headers.get('content-disposition')).toContain('lxo-session-encrypted-session.zip.age')
    expect(response.headers.get('x-lxo-archive-format')).toBe('age')
    expect(response.headers.get('cache-control')).toBe('no-store')
    const ciphertext = new Uint8Array(await response.arrayBuffer())
    expect(strFromU8(ciphertext)).not.toContain('"id":"encrypted-session"')
    const decrypt = new Decrypter()
    decrypt.addIdentity(identity)
    const zip = await decrypt.decrypt(ciphertext)
    expect(strFromU8(unzipSync(zip)[SESSION_LOG_FILENAME]!)).toContain('"id":"encrypted-session"')
    const wrong = new Decrypter()
    wrong.addIdentity(await generateX25519Identity())
    await expect(wrong.decrypt(ciphertext)).rejects.toThrow()
    const changed = ciphertext.slice()
    changed[changed.length - 1] = changed[changed.length - 1]! ^ 1
    await expect(decrypt.decrypt(changed)).rejects.toThrow()
    await expect(decrypt.decrypt(ciphertext.slice(0, -1))).rejects.toThrow()
    const head = await fetch.fetch(new Request(url, { method: 'HEAD' }), connection.browserPeer)
    expect(head.status).toBe(200)
    expect(head.body).toBeNull()
    expect(head.headers.get('x-lxo-archive-format')).toBe('age')
  } finally { await dispose() }
})

it('rejects an invalid recipient before registering any download route', async () => {
  const ctx = new Context()
  let registered = 0
  ctx.provide('commands', { register: () => () => {} } as never)
  ctx.provide('connection', { fetch: { register: () => { registered++; return () => Promise.resolve() } } } as never)
  try {
    expect(() => { apply(ctx, { encryptionRecipient: 'invalid-recipient' }) }).toThrow()
    expect(registered).toBe(0)
  } finally { await ctx.fiber.dispose() }
})

it.each(['cancel', 'abort'] as const)('propagates %s through encrypted exports to a pending descendant query', async (action) => {
  const entered = Promise.withResolvers<AbortSignal>()
  const stopped = Promise.withResolvers<undefined>()
  const identity = await generateX25519Identity()
  const { connection, dispose } = await mounted(true, { encryptionRecipient: await identityToRecipient(identity) },
    async (_id, signal) => {
      if (signal === undefined) throw new Error('missing producer cancellation')
      entered.resolve(signal)
      return new Promise((_resolve, reject) => {
        const abort = () => { reject(signal.reason instanceof Error ? signal.reason : new Error('export cancelled')); stopped.resolve(undefined) }
        if (signal.aborted) abort()
        else signal.addEventListener('abort', abort, { once: true })
      })
    })
  const abort = new AbortController()
  try {
    const response = await connection.createSharedFetchHandler('/api').fetch(new Request(
      `http://host${SESSION_LOG_EXPORT_PATH}?sessionId=pending&includeDescendants=true`, { signal: abort.signal },
    ), connection.browserPeer)
    expect(response.headers.get('x-lxo-archive-format')).toBe('age')
    if (action === 'cancel') {
      const reader = response.body!.getReader()
      await reader.read()
      const producer = await entered.promise
      await reader.cancel()
      await stopped.promise
      expect(producer.aborted).toBe(true)
    } else {
      const completed = response.arrayBuffer()
      await entered.promise
      abort.abort(new Error('fixture request aborted'))
      await expect(completed).rejects.toThrow()
      await stopped.promise
    }
  } finally { abort.abort(); await dispose() }
})

it('fails an encrypted download when its descendant query fails instead of returning a partial archive', async () => {
  const identity = await generateX25519Identity()
  const { connection, dispose } = await mounted(true, { encryptionRecipient: await identityToRecipient(identity) },
    () => Promise.reject(new Error('fixture descendant read failed')))
  try {
    const response = await connection.createSharedFetchHandler('/api').fetch(new Request(
      `http://host${SESSION_LOG_EXPORT_PATH}?sessionId=failed&includeDescendants=true`,
    ), connection.browserPeer)
    expect(response.headers.get('x-lxo-archive-format')).toBe('age')
    await expect(response.arrayBuffer()).rejects.toThrow('fixture descendant read failed')
  } finally { await dispose() }
})
