// @vitest-environment jsdom
/** Frame interactions with a real store and explicitly driven browser measurements. */
import type { GlobalStandardProps, RenderOpts } from '@deepseek-ai/dsh-client-ui-slots'
import { allowAllAccess, bindSnapshotSelector } from '@deepseek-ai/dsh-client-test-runtime'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render } from '@testing-library/react'
import { AppFrame } from '../src/client/AppFrame.tsx'
import type { AppFrameProps } from '../src/client/AppFrame.tsx'
import type { MainPanelId, RightbarOwnerProps, SidebarOwnerProps } from '../src/client/index.ts'
import { createLayoutStore } from '../src/client/stores.ts'
import type { WorkspaceSnapshot } from '@deepseek-ai/dsh-api-workspace-controller/client'
import type { SessionId } from '@deepseek-ai/dsh-session/types'

const useResource = (() => ({ status: 'none' as const, value: undefined, failure: undefined })) as GlobalStandardProps['useResource']
let selectedSession: SessionId | undefined
let selectedSessionTitle: string | undefined
let workspacesReady = true
type AttentionSnapshot = Parameters<Parameters<AppFrameProps['useSessionStatus']>[0]>[0]
const noAttention: AttentionSnapshot = new Map()
const useSessionStatus: AppFrameProps['useSessionStatus'] = selector => selector(noAttention)

let observers: ResizeObserverStub[]
class ResizeObserverStub {
  disconnected = false
  constructor(private callback: ResizeObserverCallback) { observers.push(this) }
  observe(): void {}
  unobserve(): void {}
  disconnect(): void { this.disconnected = true }
  fire(): void { this.callback([], this) }
}

let frameWidth: number
let animationFrames: Map<number, FrameRequestCallback>
let nextFrame: number
let originalTitle: string
/** Flush one browser frame without depending on the worker's timer cadence. */
function flushFrames(): void {
  for (const [id, callback] of [...animationFrames]) {
    if (!animationFrames.delete(id)) continue
    callback(0)
  }
}

function resize(width: number): void {
  frameWidth = width
  act(() => {
    for (const observer of observers) if (!observer.disconnected) observer.fire()
    flushFrames()
  })
}

function mountFrame(windowWidth = frameWidth) {
  vi.stubGlobal('innerWidth', windowWidth)
  const instance = createLayoutStore().create()
  const slotCalls: { key: string; props: object; options: RenderOpts | undefined }[] = []
  const renderSlot: AppFrameProps['renderSlot'] = (key, owner, options) => {
    slotCalls.push({ key, props: owner, options })
    return <div data-testid={`${key}-content`} data-entry-key={options?.entryKey} />
  }
  const useSessions: AppFrameProps['useSessions'] = sel => sel({
    ids: selectedSession === undefined ? [] : [selectedSession],
    byId: selectedSession === undefined ? {} : {
      [selectedSession]: {
        id: selectedSession, displayTitle: 'Test', running: false, retainedBy: { mainView: 1 }, blank: false, updatedAt: 1,
        ...(selectedSessionTitle === undefined ? {} : { title: selectedSessionTitle }),
      },
    },
    phase: 'ready',
    projectionsBySession: {},
  })
  const workspaceState: WorkspaceSnapshot = {
    items: [], archivedSessionIds: [], pinnedSessionIds: [], state: 'idle', phase: 'ready', error: null,
    ...(workspacesReady ? {} : { state: 'loading' as const, phase: 'pending' as const }),
  }
  const useStore = bindSnapshotSelector(instance)
  const usePanelInfo = bindSnapshotSelector({
    getSnapshot: () => instance.getSnapshot().panelInfo,
    subscribe: listener => instance.subscribe(listener),
  })
  const element = () => (
    <AppFrame
      useStore={useStore}
      actions={instance.actions}
      renderSlot={renderSlot}
      useSessions={useSessions}
      usePanelInfo={usePanelInfo}
      useSessionStatus={useSessionStatus}
      useSessionRetainInfo={() => undefined}
      useResource={useResource}
      useWorkspaces={sel => sel(workspaceState)}
      {...allowAllAccess}
      t={key => key === 'brand.localBuild' ? 'LXO Local Build' : key}
    />
  )
  const utils = render(element())
  const frame = utils.container.firstElementChild as HTMLElement
  return {
    ...utils, instance, frame, slotCalls,
    rerenderFrame: () => { utils.rerender(element()) },
    rightOwner: () => slotCalls.findLast(c => c.key === 'rightbar')!.props as RightbarOwnerProps,
    sidebarOwner: () => slotCalls.findLast(c => c.key === 'sidebar')!.props as SidebarOwnerProps,
  }
}

beforeEach(() => {
  originalTitle = document.title
  frameWidth = 1440
  selectedSession = 's-test' as SessionId
  selectedSessionTitle = undefined
  workspacesReady = true
  observers = []
  animationFrames = new Map()
  nextFrame = 1
  vi.stubEnv('DSH_CLIENT_TITLE', undefined)
  vi.stubGlobal('ResizeObserver', ResizeObserverStub)
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    const id = nextFrame++
    animationFrames.set(id, callback)
    return id
  })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => { animationFrames.delete(id) })
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(() => ({
    width: frameWidth, height: 900, top: 0, left: 0, right: frameWidth, bottom: 900,
    x: 0, y: 0, toJSON: () => ({}),
  }))
})

afterEach(() => {
  cleanup()
  delete document.documentElement.dataset.platform
  document.documentElement.removeAttribute('data-windows-titlebar')
  document.title = originalTitle
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('AppFrame', () => {
  it('localizes the title without a configured build title', () => {
    mountFrame()
    expect(document.title).toBe('LXO Local Build')
  })

  it('follows the selected durable Session title', () => {
    vi.stubEnv('DSH_CLIENT_TITLE', 'Product')
    selectedSessionTitle = 'First'
    const { rerenderFrame } = mountFrame()
    expect(document.title).toBe('First — Product')
    selectedSessionTitle = 'Revised'
    rerenderFrame()
    expect(document.title).toBe('Revised — Product')
    selectedSession = undefined
    rerenderFrame()
    expect(document.title).toBe('Product')
  })

  it('keeps the right panel available at its fixed width beside a closed track', () => {
    const { frame, sidebarOwner, rightOwner } = mountFrame()
    expect(sidebarOwner()).toEqual({ collapsed: false, width: 236 })
    expect(rightOwner()).toEqual({ width: 336, viewportWidth: 1440, canShow: true })
    expect(frame.style.getPropertyValue('--dsh-rightbar-track-width')).toBe('0px')
    expect(frame.querySelector('[data-side]')).toBeNull()
  })

  it('reserves the fixed right width only while the occupant reports a track', () => {
    const { frame, instance } = mountFrame()
    act(() => { instance.actions.openRightbar(true, false) })
    expect(frame.style.getPropertyValue('--dsh-rightbar-track-width')).toBe('336px')
    expect(frame.dataset.rightbarOpen).toBe('true')
    act(() => { instance.actions.closeRightbar() })
    expect(frame.style.getPropertyValue('--dsh-rightbar-track-width')).toBe('0px')
    expect(frame.dataset.rightbarOpen).toBeUndefined()
  })

  it('hides the left column completely and restores it to 236px using its button', () => {
    const { frame, instance, getByRole, sidebarOwner } = mountFrame()
    act(() => { instance.actions.openRightbar(true, false) })
    const geometry = instance.getSnapshot().layoutInfo
    const sidebar = frame.firstElementChild
    fireEvent.click(getByRole('button', { name: 'sidebar.collapse' }))
    expect(frame.style.getPropertyValue('--dsh-sidebar-track-width')).toBe('0px')
    expect(frame.dataset.sidebarCollapsed).toBe('true')
    expect(getByRole('button', { name: 'sidebar.expand' }).getAttribute('aria-expanded')).toBe('false')
    expect(instance.getSnapshot().layoutInfo).toBe(geometry)
    resize(390)
    expect(frame.style.getPropertyValue('--dsh-sidebar-track-width')).toBe('0px')
    fireEvent.click(getByRole('button', { name: 'sidebar.expand' }))
    expect(frame.style.getPropertyValue('--dsh-sidebar-track-width')).toBe('236px')
    expect(frame.dataset.sidebarCollapsed).toBeUndefined()
    expect(sidebarOwner()).toEqual({ collapsed: false, width: 236 })
    expect(frame.firstElementChild).toBe(sidebar)
  })

  it.each([1181, 1180, 1024, 768, 390])('retains both panel widths at a %ipx frame', (width) => {
    const { frame, instance, sidebarOwner, rightOwner } = mountFrame()
    act(() => { instance.actions.openRightbar(true, false) })
    resize(width)
    expect(sidebarOwner()).toEqual({ collapsed: false, width: 236 })
    expect(rightOwner()).toEqual({ width: 336, viewportWidth: width, canShow: true })
    expect(frame.dataset.rightbarCollapsed).toBe(width <= 1180 ? 'true' : undefined)
    expect(frame.dataset.rightbarOpen).toBe('true')
  })


  it.each(['darwin', 'win32'])('keeps a fixed navigation column on %s', (platform) => {
    document.documentElement.dataset.platform = platform
    if (platform === 'win32') document.documentElement.setAttribute('data-windows-titlebar', '')
    const { frame, sidebarOwner, queryByTestId } = mountFrame()
    resize(390)
    expect(sidebarOwner()).toEqual({ collapsed: false, width: 236 })
    expect(queryByTestId('shell.leading-content')).toBeNull()
    expect(frame.style.getPropertyValue('--dsh-sidebar-track-width')).toBe('236px')
    if (platform === 'win32') expect(frame.style.getPropertyValue('--dsh-windows-sidebar-width')).toBe('236px')
  })

  it('keeps explicit fullscreen reports separate from the normal track', () => {
    const { frame, instance } = mountFrame()
    act(() => { instance.actions.openRightbar(true, true) })
    expect(frame.dataset.rightbarFullscreen).toBe('true')
    expect(frame.style.getPropertyValue('--dsh-rightbar-track-width')).toBe('336px')
    act(() => { instance.actions.openRightbar(true, false) })
    expect(frame.dataset.rightbarFullscreen).toBeUndefined()
    expect(frame.dataset.rightbarInstant).toBe('true')
  })

  it('selects global panels without removing the current main or right slots', () => {
    const { instance, slotCalls, getByTestId } = mountFrame()
    act(() => { instance.actions.selectPanel('plugins' as MainPanelId) })
    expect(slotCalls.findLast(c => c.key === 'main')?.options?.entryKey).toBe('plugins')
    expect(getByTestId('rightbar-content')).toBeTruthy()
    expect(getByTestId('shell.bottom-content')).toBeTruthy()
    expect(getByTestId('shell.overlay-content')).toBeTruthy()
  })

  it('coalesces measurements and cancels the pending frame at teardown', () => {
    const { instance, unmount } = mountFrame(1920)
    expect(instance.getSnapshot().layoutInfo.viewportWidth).toBe(1440)
    frameWidth = 1000
    act(() => { observers[0]!.fire(); observers[0]!.fire() })
    expect(animationFrames.size).toBe(1)
    act(flushFrames)
    expect(instance.getSnapshot().layoutInfo.viewportWidth).toBe(1000)
    act(() => { observers[0]!.fire() })
    unmount()
    expect(observers[0]!.disconnected).toBe(true)
    expect(animationFrames.size).toBe(0)
    observers[0]!.fire()
    expect(animationFrames.size).toBe(0)
  })

  it('ignores zero-width frame measurements', () => {
    const { instance } = mountFrame()
    resize(0)
    expect(instance.getSnapshot().layoutInfo.viewportWidth).toBe(1440)
  })
})
