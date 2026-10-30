import { describe, expect, it } from 'vitest'
import { computeColumns } from '../src/client/columns.ts'

describe('fixed three-column layout', () => {
  it.each([
    [1440, true, { sidebar: 236, center: 868, rightbar: 336 }],
    [1181, true, { sidebar: 236, center: 609, rightbar: 336 }],
    [1180, true, { sidebar: 236, center: 944, rightbar: 0 }],
    [768, true, { sidebar: 236, center: 532, rightbar: 0 }],
    [390, true, { sidebar: 236, center: 154, rightbar: 0 }],
    [1440, false, { sidebar: 236, center: 1204, rightbar: 0 }],
    [390, false, { sidebar: 236, center: 154, rightbar: 0 }],
  ] as const)('resolves %ipx with right track=%s', (viewport, shown, expected) => {
    expect(computeColumns(viewport, shown)).toEqual(expected)
  })
})
