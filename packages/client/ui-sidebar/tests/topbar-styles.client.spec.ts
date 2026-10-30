/** Center top bar clearance for the collapsed sidebar's reopen button. */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const css = readFileSync(fileURLToPath(new URL('../src/client/WorkbenchTopbar.module.css', import.meta.url)), 'utf8')

describe('WorkbenchTopbar.module.css', () => {
  it('keeps the search button clear of the collapsed sidebar reopen control', () => {
    const bar = css.slice(css.indexOf('.bar {'), css.indexOf('}', css.indexOf('.bar {')))
    expect(bar).toContain('padding-inline-start: calc(14px + var(--dsh-sidebar-reopen-clearance, 0px))')
  })
})
