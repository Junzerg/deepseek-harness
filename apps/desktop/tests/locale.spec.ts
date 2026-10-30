import { describe, expect, it } from 'vitest'
import { en, zh, formatDesktopMessage, resolveDesktopLocale, resolveDesktopStartupLocale } from '../src/locale.ts'

describe('Desktop English and Chinese locales', () => {
  it('keeps Chinese keys and placeholders aligned with English', () => {
    expect(Object.keys(zh)).toEqual(Object.keys(en))
    for (const key of Object.keys(en) as (keyof typeof en)[]) {
      const placeholders = (value: string) => value.match(/\{\w+\}/gu) ?? []
      expect(placeholders(zh[key]), key).toEqual(placeholders(en[key]))
    }
  })
  it('resolves supported language variants and falls back for removed languages', () => {
    expect(resolveDesktopLocale('zh-Hans-CN').messages).toBe(zh)
    expect(resolveDesktopLocale('en-US').messages).toBe(en)
    expect(resolveDesktopLocale('ja-JP').messages).toBe(en)
    expect(resolveDesktopStartupLocale('ja', ['zh-CN']).id).toBe('zh-CN')
    expect(resolveDesktopStartupLocale(null, ['ja-JP', 'zh-Hant', 'en-US']).id).toBe('zh-CN')
    expect(resolveDesktopStartupLocale(null, ['ja-JP']).id).toBe('en')
    expect(resolveDesktopStartupLocale('zh', ['en-US']).id).toBe('zh-CN')
    expect(resolveDesktopStartupLocale('EN', ['zh-CN']).id).toBe('en')
    expect(resolveDesktopStartupLocale(null, []).id).toBe('en')
  })
  it('formats named values and retains unknown placeholders', () => {
    expect(formatDesktopMessage('{name}@{version} {missing}', { name: 'plugin', version: '1.2.3' }))
      .toBe('plugin@1.2.3 {missing}')
  })
})
