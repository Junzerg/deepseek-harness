/** Workbench composer card chrome for the blank home and the docked chat bar. */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const css = readFileSync(fileURLToPath(new URL('../src/client/skeleton/InputBar.module.css', import.meta.url)), 'utf8')

function rule(selector: string): string {
  const at = css.indexOf(selector)
  expect(at).toBeGreaterThanOrEqual(0)
  const brace = css.indexOf('{', at)
  return css.slice(brace, css.indexOf('}', brace))
}

describe('InputBar.module.css blank-home composer', () => {
  it('gives the hero card the workbench border, radius, and accent focus', () => {
    const card = rule('.hero .card')
    expect(card).toContain('border: 1px solid var(--dsw-alias-border-l2)')
    expect(card).toContain('max-width: 780px')
    expect(card).toContain('border-radius: 18px')
    expect(card).toContain('box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05)')
    const focus = rule('.hero .card:focus-within')
    expect(focus).toContain('border-color: var(--dsw-specific-sidebar-accent)')
  })

  it('draws the hero plus as a line icon and the send control as an ink circle', () => {
    const plus = rule('.hero .add')
    expect(plus).toContain('background: transparent')
    const send = rule('.hero .primary')
    expect(send).toContain('width: 30px')
    expect(send).toContain('height: 30px')
    expect(send).toContain('background: var(--dsw-alias-label-primary)')
    const disabled = rule('.hero .primary:disabled')
    expect(disabled).toContain('background: var(--dsw-static-neutral-bluish-300)')
  })

  it('gives the docked chat card the same chrome at the 820px chat width', () => {
    const card = rule('.root:not(.hero) .card')
    expect(card).toContain('max-width: 820px')
    expect(card).toContain('border-radius: 18px')
    expect(card).toContain('box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05)')
    const send = rule('.root:not(.hero) .primary')
    expect(send).toContain('width: 30px')
    expect(send).toContain('background: var(--dsw-alias-label-primary)')
  })
})
