/** Metadata coverage rejects missing translations through the same checker used by CI. */
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, expect, it } from 'vitest'
import { localeMetadataProblems } from './verify-locale-metadata.ts'

import { SHIPPED_LOCALE_IDS } from './shipped-locales.ts'

const roots: string[] = []
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }) })

function fixture(english: unknown = { meta: { title: 'Name {name}' } }): string {
  const root = mkdtempSync(join(tmpdir(), 'dsh-locale-meta-'))
  roots.push(root)
  const directory = join(root, 'packages/demo/plugin/locale')
  mkdirSync(directory, { recursive: true })
  writeFileSync(join(directory, 'en.json'), JSON.stringify(english))
  writeFileSync(join(directory, 'zh.json'), JSON.stringify({ meta: { title: '名称 {name}', description: '描述' } }))
  return root
}

it('accepts English and optional Chinese metadata', () => {
  expect(localeMetadataProblems(fixture())).toEqual([])
})

it('rejects empty English metadata text', () => {
  expect(localeMetadataProblems(fixture({ meta: { title: '' } })).join('\n')).toContain('expected non-empty text')
})

it('checks referenced detail documents', () => {
  const root = fixture()
  const directory = join(root, 'packages/demo/plugin/locale')
  const meta = { title: 'Name {name}', detail: 'docs/DETAIL.md' }
  for (const language of SHIPPED_LOCALE_IDS) writeFileSync(join(directory, `${language}.json`), JSON.stringify({ meta }))
  expect(localeMetadataProblems(root).join('\n')).toContain('missing detail resource')
  mkdirSync(join(directory, '../docs'))
  writeFileSync(join(directory, '../docs/DETAIL.md'), '# Detail\n')
  expect(localeMetadataProblems(root)).toEqual([])
})

it('does not mistake package.json in the locale service package for a translation', () => {
  const root = fixture()
  const directory = join(root, 'packages/client/locale')
  mkdirSync(directory, { recursive: true })
  writeFileSync(join(directory, 'package.json'), '{"name":"locale"}')
  mkdirSync(join(directory, 'src'))
  writeFileSync(join(directory, 'src/index.ts'), 'export {}')
  expect(localeMetadataProblems(root)).toEqual([])
})

it('rejects an empty discovery', () => {
  const root = mkdtempSync(join(tmpdir(), 'dsh-locale-empty-'))
  roots.push(root)
  expect(localeMetadataProblems(root)).toEqual(['no package locale metadata found'])
})

it('rejects loadable plugins without any locale directory', () => {
  const root = fixture()
  const directory = join(root, 'packages/demo/new-plugin')
  mkdirSync(join(directory, 'src'), { recursive: true })
  writeFileSync(join(directory, 'package.json'), JSON.stringify({ name: '@deepseek-ai/dsh-new-plugin' }))
  writeFileSync(join(directory, 'src/index.ts'), 'export function apply() {}')
  expect(localeMetadataProblems(root).join('\n')).toContain('new-plugin/locale')
})

it('checks nested subpath locale resources and package-relative detail files', () => {
  const root = fixture()
  const directory = join(root, 'packages/demo/plugin/locale/tools')
  mkdirSync(directory)
  for (const language of ['en', 'zh']) writeFileSync(join(directory, `${language}.json`), JSON.stringify({ meta: { title: 'Tools', detail: 'docs/TOOLS.md' } }))
  mkdirSync(join(root, 'packages/demo/plugin/docs'))
  writeFileSync(join(root, 'packages/demo/plugin/docs/TOOLS.md'), '# Tools\n')
  expect(localeMetadataProblems(root)).toEqual([])
})

it.each(['../../other/README.md', 'docs\\DETAIL.md', 'docs/DETAIL.txt', '/README.md'])('rejects runtime-invalid detail path %s', (detail) => {
  const root = fixture({ meta: { title: 'Name {name}', description: '説明', detail } })
  expect(localeMetadataProblems(root).join('\n')).toMatch(/must (?:be a relative path|name a Markdown file)/u)
})

it('requires sentence punctuation for English descriptions', () => {
  const root = fixture()
  const file = join(root, 'packages/demo/plugin/locale/en.json')
  writeFileSync(file, JSON.stringify({ meta: { title: 'Name {name}', description: 'Description' } }))
  expect(localeMetadataProblems(root).join('\n')).toContain('sentence punctuation')
  writeFileSync(file, JSON.stringify({ meta: { title: 'Name {name}', description: 'English description.' } }))
  expect(localeMetadataProblems(root)).toEqual([])
})

it('permits missing Chinese resources for loadable plugins', () => {
  const root = fixture({ meta: { title: 'Name {name}' } })
  const directory = join(root, 'packages/demo/plugin')
  mkdirSync(join(directory, 'src'))
  writeFileSync(join(directory, 'src/index.ts'), 'export function apply() {}')
  writeFileSync(join(directory, 'package.json'), JSON.stringify({ name: '@deepseek-ai/dsh-demo' }))
  rmSync(join(directory, 'locale/zh.json'))
  expect(localeMetadataProblems(root)).toEqual([])
})

it('excludes packages formally classified as test helpers', () => {
  const root = fixture()
  const directory = join(root, 'packages/test-support/llm-replay')
  mkdirSync(join(directory, 'src'), { recursive: true })
  writeFileSync(join(directory, 'src/index.ts'), 'export function apply() {}')
  writeFileSync(join(directory, 'package.json'), JSON.stringify({ name: '@deepseek-ai/dsh-llm-replay' }))
  expect(localeMetadataProblems(root)).toEqual([])
})

it.each(['\u200b', '\ufeff', String.raw`\u200b`, String.raw`\ufeff`])('rejects invisible characters in JSON resources', (character) => {
  const root = fixture()
  const file = join(root, 'packages/demo/plugin/locale/en.json')
  writeFileSync(file, readFileSync(file, 'utf8').replace('Name {name}', `Localized${character} description.`))
  expect(localeMetadataProblems(root).join('\n')).toContain('invisible locale character')
})
