/** Offline admin tool authenticates the complete file before publishing a ZIP. */
import { execFile } from 'node:child_process'
import { mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { Decrypter, Encrypter, generateX25519Identity } from 'age-encryption'
import { expect, it, onTestFinished } from 'vitest'

const run = promisify(execFile)
const tool = fileURLToPath(new URL('../scripts/session-log-admin.mjs', import.meta.url))

it('creates isolated keys, decrypts privately and never publishes damaged or unauthorized output', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'lxo-admin-test-'))
  onTestFinished(async () => { await rm(directory, { recursive: true, force: true }) })
  const keys = join(directory, 'admin')
  const invoke = (...args: string[]) => run(process.execPath, [tool, ...args], { timeout: 30_000 })
  const generated = await invoke('keygen', keys)
  const password = (await readFile(join(keys, 'password.txt'), 'utf8')).trim()
  expect(password.length).toBeGreaterThanOrEqual(40)
  expect(generated.stdout).not.toContain(password)
  expect(generated.stderr).not.toContain(password)
  const recipient = (await readFile(join(keys, 'recipient.txt'), 'utf8')).trim()
  expect(recipient).toMatch(/^age1/)
  const identity = join(keys, 'identity.age'), passwordFile = join(keys, 'password.txt')
  const encryptedIdentity = await readFile(identity)
  expect(encryptedIdentity.toString()).not.toContain('AGE-SECRET-KEY-')
  if (process.platform !== 'win32') {
    expect((await stat(keys)).mode & 0o777).toBe(0o700)
    expect((await stat(identity)).mode & 0o777).toBe(0o600)
    expect((await stat(passwordFile)).mode & 0o777).toBe(0o600)
  }
  await expect(invoke('keygen', keys)).rejects.toThrow()
  expect(await readFile(identity)).toEqual(encryptedIdentity)
  const encrypter = new Encrypter()
  encrypter.addRecipient(recipient)
  const plain = new Uint8Array(150_000).fill(42)
  const ciphertext = await encrypter.encrypt(plain)
  const source = join(directory, 'session.zip.age'), output = join(directory, 'result.zip')
  await writeFile(source, ciphertext)
  await invoke('decrypt', identity, passwordFile, source, output)
  expect(new Uint8Array(await readFile(output))).toEqual(plain)
  await expect(invoke('decrypt', identity, passwordFile, source, output)).rejects.toThrow()
  expect(new Uint8Array(await readFile(output))).toEqual(plain)
  const wrongPassword = join(directory, 'wrong-password.txt')
  await writeFile(wrongPassword, 'wrong')
  const rejected = join(directory, 'rejected.zip')
  await expect(invoke('decrypt', identity, wrongPassword, source, rejected)).rejects.toThrow()
  await expect(stat(rejected)).rejects.toThrow()
  const wrongIdentity = new Encrypter()
  wrongIdentity.setPassphrase(password)
  const wrongKey = join(directory, 'wrong-key.age')
  await writeFile(wrongKey, await wrongIdentity.encrypt(await generateX25519Identity()))
  await expect(invoke('decrypt', wrongKey, passwordFile, source, rejected)).rejects.toThrow()
  await expect(stat(rejected)).rejects.toThrow()
  for (const damaged of [ciphertext.slice(0, -1), ciphertext.map((byte, i) => i === ciphertext.length - 1 ? byte ^ 1 : byte)]) {
    await writeFile(source, damaged)
    await expect(invoke('decrypt', identity, passwordFile, source, rejected)).rejects.toThrow()
    await expect(stat(rejected)).rejects.toThrow()
    expect((await readdir(directory)).filter(name => name.startsWith('.lxo-decrypt-'))).toEqual([])
  }
  await writeFile(source, 'age-encryption.org/v1\n-> ' + 'A'.repeat(2 * 1024 * 1024))
  await expect(invoke('decrypt', identity, passwordFile, source, rejected)).rejects.toThrow()
  await expect(stat(rejected)).rejects.toThrow()
  expect((await readdir(directory)).filter(name => name.startsWith('.lxo-decrypt-'))).toEqual([])
  // A private identity can be recovered with the administrator password, independently of the CLI.
  const unlock = new Decrypter()
  unlock.addPassphrase(password)
  expect(await unlock.decrypt(new Uint8Array(encryptedIdentity), 'text')).toMatch(/^AGE-SECRET-KEY-/)
}, 60_000)
