// @vitest-environment jsdom
/** The chip title: an outline folder, then the type's label. */
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { FilesTitle } from '../src/client/FilesTitle.tsx'

afterEach(cleanup)

function props(title: string): PropsRuntime<'sidebar.right.pane.tab.title'> {
  return { useTabInfo: () => ({ tab: { title } }) } as unknown as PropsRuntime<'sidebar.right.pane.tab.title'>
}

describe('FilesTitle', () => {
  it('draws the outline folder before the title text, sized to the chip line', () => {
    const { container } = render(<FilesTitle {...props('文件')} />)
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('width')).toBe('14')
    expect(svg?.getAttribute('aria-hidden')).toBe('true')
    expect(container.textContent).toBe('文件')
  })
})
