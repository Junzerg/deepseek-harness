import type { MainPanelId } from '@deepseek-ai/dsh-client-ui-layout/client'
import type { InjectFace } from '@deepseek-ai/dsh-client-ui-slots'
import type { SidebarRootComponentProps } from './contract/slots.ts'
import css from './SidebarRoot.module.css'

/** Placeholder destinations in prototype navigation order. */
export const NAV_PAGE_IDS = ['experts', 'library', 'assistant', 'project', 'more'] as const

type Page = typeof NAV_PAGE_IDS[number]
/** Static destination supplied by the page registration. */
export type PlaceholderInjected = { page: Page }

/** Main-panel identity for one placeholder destination. */
export function placeholderPanelId(page: Page): MainPanelId {
  return `sidebar-${page}` as MainPanelId
}

const PATHS = {
  experts: 'M4 4h6.4v6.4H4zM13.6 4H20v6.4h-6.4zM4 13.6h6.4V20H4zM13.6 13.6H20V20h-6.4z',
  library: 'M4.5 5.2A1.7 1.7 0 0 1 6.2 3.5H19v14H6.2a1.7 1.7 0 0 0-1.7 1.7zM19 17.5v3H6.2',
  assistant: 'M12 3v3M7.5 6h9A1.5 1.5 0 0 1 18 7.5v8A1.5 1.5 0 0 1 16.5 17h-9A1.5 1.5 0 0 1 6 15.5v-8A1.5 1.5 0 0 1 7.5 6zM9.5 12h.01M14.5 12h.01M9.5 14.5h5',
  project: 'M3.5 7.2 12 3.3l8.5 3.9v9.6L12 20.7l-8.5-3.9zM3.5 7.2 12 11.3l8.5-4.1M12 11.3v9.4',
  more: 'M5.5 12h.01M12 12h.01M18.5 12h.01',
}

/** Original prototype artwork shared by the navigation and placeholder pages. */
export function PlaceholderIcon({ page, size = 17 }: { page: Page; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={PATHS[page]} />
  </svg>
}

/** Planned application page using the prototype's placeholder layout. */
export function PlaceholderPage({ t, page }: Pick<SidebarRootComponentProps, 't'> & InjectFace<PlaceholderInjected>) {
  return <section className={css.morePage}>
    <div className={css.morePageIcon}><PlaceholderIcon page={page} size={48} /></div>
    <h2>{t(`${page}.title`)}</h2>
    <p>{t(`${page}.description`)}</p>
  </section>
}
