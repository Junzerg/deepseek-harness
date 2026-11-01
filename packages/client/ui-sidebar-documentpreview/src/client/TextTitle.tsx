/**
 * The text type's chip title: an outline document before the name
 * the registry captured at open time. Registered under
 * `sidebar.right.pane.tab.title`; without it the chip would show the bare name.
 */
import type { ReactNode } from 'react'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { IconBrowseOutlineRegular } from '@deepseek-ai/dsh-client-ui-primitives'
import css from './TextPreview.module.css'

/**
 * The title as the chip and a floating panel's header show it.
 * @param props - the tab information hook.
 * @returns the 14px document glyph followed by the tab's title text.
 */
export function TextTitle({ useTabInfo }: PropsRuntime<'sidebar.right.pane.tab.title'>): ReactNode {
  const { tab } = useTabInfo()
  return (
    <>
      <IconBrowseOutlineRegular size={14} className={css.titleIcon} />
      {tab.title}
    </>
  )
}
