/** Offline administrator key creation and authenticated Session archive decryption. */
import { randomBytes } from 'node:crypto'
import { createReadStream, createWriteStream } from 'node:fs'
import { chmod, link, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { fileURLToPath } from 'node:url'
import { Decrypter, Encrypter, generateX25519Identity, identityToRecipient } from 'age-encryption'

async function createKeys(directory) {
  // Exclusive directory ownership prevents overwriting an existing administrator identity.
  await mkdir(directory, { mode: 0o700 })
  try {
    await chmod(directory, 0o700)
    const identity = await generateX25519Identity()
    const recipient = await identityToRecipient(identity)
    const password = randomBytes(32).toString('base64url')
    const encrypter = new Encrypter()
    encrypter.setPassphrase(password)
    await writeFile(join(directory, 'identity.age'), await encrypter.encrypt(identity), { mode: 0o600, flag: 'wx' })
    await writeFile(join(directory, 'password.txt'), password + '\n', { mode: 0o600, flag: 'wx' })
    await writeFile(join(directory, 'recipient.txt'), recipient + '\n', { mode: 0o600, flag: 'wx' })
  } catch (error) {
    await rm(directory, { recursive: true, force: true })
    throw error
  }
}

async function decryptArchive(identityPath, passwordPath, source, destination) {
  const unlock = new Decrypter()
  unlock.addPassphrase((await readFile(passwordPath, 'utf8')).trim())
  const identity = await unlock.decrypt(new Uint8Array(await readFile(identityPath)), 'text')
  const decrypter = new Decrypter()
  decrypter.addIdentity(identity)
  // Only publish a completed, authenticated ZIP. A damaged final chunk must leave no usable output.
  const temporary = await mkdtemp(join(dirname(destination), '.lxo-decrypt-'))
  await chmod(temporary, 0o700)
  const output = join(temporary, 'session.zip')
  const input = createReadStream(source, { highWaterMark: 64 * 1024 })
  try {
    let parsingHeader = true
    let headerBytes = 0
    const bounded = Readable.toWeb(input).pipeThrough(new TransformStream({
      transform(chunk, controller) {
        if (parsingHeader) {
          headerBytes += chunk.byteLength
          if (headerBytes > 1024 * 1024) throw new Error('Archive header exceeds 1 MiB')
        }
        controller.enqueue(chunk)
      },
    }))
    const plaintext = await decrypter.decrypt(bounded)
    parsingHeader = false
    await pipeline(Readable.fromWeb(plaintext), createWriteStream(output, { mode: 0o600, flags: 'wx' }))
    // An exclusive hard link publishes atomically without overwriting an existing destination.
    await link(output, destination)
  } finally {
    input.destroy()
    if (!input.closed) await new Promise(resolveClose => input.once('close', resolveClose))
    await rm(temporary, { recursive: true, force: true })
  }
}

async function main(args) {
  if (args[0] === 'keygen' && args.length === 2) {
    await createKeys(resolve(args[1]))
    console.info('Administrator key files created. Keep identity.age and password.txt off employee machines.')
  } else if (args[0] === 'decrypt' && args.length === 5) {
    await decryptArchive(...args.slice(1).map(value => resolve(value)))
    console.info('Session archive decrypted and authenticated.')
  } else {
    throw new Error('Usage: node session-log-admin.mjs keygen <new-directory> | decrypt <identity.age> <password.txt> <archive.zip.age> <output.zip>')
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch(() => {
    console.error('Administrator operation failed. Check the command, key, password, archive and output path. Existing output is never overwritten.')
    process.exitCode = 1
  })

}
