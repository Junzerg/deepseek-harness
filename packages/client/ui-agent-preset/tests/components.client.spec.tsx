// @vitest-environment jsdom
/**
 * The two conversation-adjacent surfaces: the new-session segment naming the
 * next session's preset, and the session header's read-only label. The split
 * is the host's rule — a session's history is produced under its preset's
 * tools, so the choice is only ever offered before one starts.
 */

import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { bindSnapshotSelector } from '@deepseek-ai/dsh-client-test-runtime'
import { createSnapshotStore } from '@deepseek-ai/dsh-client-store'
import type { SessionRetainInfo } from '@deepseek-ai/dsh-api-session-controller/client'
import { SessionId } from '@deepseek-ai/dsh-session/types'
import { AgentPresetLabel } from '../src/client/AgentPresetLabel.tsx'
import type { AgentPresetLabelProps } from '../src/client/AgentPresetLabel.tsx'
import { AgentPresetSeat } from '../src/client/AgentPresetSeat.tsx'
import type { AgentPresetSeatProps } from '../src/client/AgentPresetSeat.tsx'
import type { AgentPresetSettingsState } from '../src/client/settings-store.ts'
import type { AgentPresetSeatState } from '../src/client/seat-store.ts'
import { en } from '../src/client/locales.ts'

afterEach(cleanup)

const ROSTER_READY: AgentPresetSettingsState = {
  status: 'ready',
  error: null,
  options: [{ id: 'standard' }, { id: 'mine' }],
}

const SEAT_READY: AgentPresetSeatState = {
  current: 'standard',
  options: [
    { id: 'standard' },
    { id: 'mine' },
  ],
  busy: false,
  error: null,
  introduce: false,
}

const useSessionRetainInfo = <Selected,>(selector: (value: undefined) => Selected): Selected => selector(undefined)

/** The runtime's own `{name}` substitution, so a test reads the shown text. */
function translate(key: keyof typeof en, params?: Record<string, unknown>): string {
  const template = en[key]
  return params === undefined
    ? template
    : template.replace(/\{(\w+)\}/g, (match, name: string) => name in params ? String(params[name]) : match)
}

function renderSeat(
  state: Partial<AgentPresetSeatState> = {},
  select: () => Promise<string | undefined> = () => Promise.resolve(undefined),
  session?: { id: string; retainInfo: SessionRetainInfo | undefined },
  enabled = true,
) {
  const store = createSnapshotStore<AgentPresetSeatState>({ ...SEAT_READY, ...state })
  const developerTools = createSnapshotStore(enabled)
  const actions = {
    load: vi.fn(() => Promise.resolve()), select: vi.fn(select), introduced: vi.fn(),
    dismissRefusal: vi.fn((error: AgentPresetSeatState['error']) => {
      if (store.getSnapshot().error === error && error !== null && typeof error === 'object') {
        store.set({ ...store.getSnapshot(), error: error.reason })
      }
    }),
  }
  const props = {
    ...actions,
    sessionId: session === undefined ? undefined : SessionId(session.id),
    useDeveloperTools: bindSnapshotSelector(developerTools),
    useAgentPresetSeat: bindSnapshotSelector(store),
    useSessionRetainInfo: session === undefined
      ? useSessionRetainInfo
      : <Selected,>(selector: (value: SessionRetainInfo | undefined) => Selected) => selector(session.retainInfo),
    t: translate,
  } as AgentPresetSeatProps
  render(<AgentPresetSeat {...props} />)
  return { ...actions, developerTools, store }
}

function renderLabel(
  summary: { blank: boolean; projectionValues?: { agentPreset?: string | null } } | undefined,
  roster: Partial<AgentPresetSettingsState> = {},
) {
  // The chip and the label read the same roster, metadata included.
  const store = createSnapshotStore<AgentPresetSettingsState>({
    ...ROSTER_READY, options: SEAT_READY.options, ...roster,
  })
  const sessions = createSnapshotStore({ byId: summary === undefined ? {} : { s1: summary } })
  const load = vi.fn(() => Promise.resolve())
  const view = render(<AgentPresetLabel {...({
    load,
    sessionId: 's1',
    useSessions: bindSnapshotSelector(sessions),
    useAgentPresets: bindSnapshotSelector(store),
    t: (key: keyof typeof en) => en[key],
  } as unknown as AgentPresetLabelProps)} />)
  return { load, view }
}

describe('the new-session segment', () => {
  it.each([false, true])('offers Standard, Creator and custom presets with Developer tools %s', (enabled) => {
    const actions = renderSeat({ options: [
      { id: 'standard' }, { id: 'ptc' }, { id: 'minimal' }, { id: 'cordis' }, { id: 'mine' },
    ] }, undefined, undefined, enabled)

    expect(screen.getAllByRole('radio')).toHaveLength(enabled ? 5 : 3)
    expect(screen.getByRole('radio', { name: en.presetStandardName })).toBeTruthy()
    expect(screen.getByRole('radio', { name: 'mine' })).toBeTruthy()
    expect(screen.queryByRole('radio', { name: en.presetPtcName }) !== null).toBe(enabled)
    expect(screen.queryByRole('radio', { name: en.presetMinimalName }) !== null).toBe(enabled)
    fireEvent.click(screen.getByRole('radio', { name: en.presetCordisName }))
    expect(actions.select).toHaveBeenCalledWith('cordis')
  })

  it('keeps a named custom preset that overrides a development preset id', () => {
    renderSeat({ options: [{ id: 'ptc', name: 'My workflow' }] }, undefined, undefined, false)
    expect(screen.getByRole('radio', { name: 'My workflow' })).toBeTruthy()
  })

  it('keeps the current mode visible and locked when Coding Tools hide every row', () => {
    const actions = renderSeat({ current: 'minimal', options: [{ id: 'ptc' }, { id: 'minimal' }] }, undefined, undefined, false)
    const current = screen.getByRole<HTMLButtonElement>('radio', { name: en.presetMinimalName })
    expect(current.disabled).toBe(true)
    expect(current.getAttribute('aria-checked')).toBe('true')
    fireEvent.click(current)
    expect(actions.select).not.toHaveBeenCalled()
  })

  it('locks to the staged mode when every other option disappears, then unlocks when options return', () => {
    const options = [{ id: 'minimal' }, { id: 'mine' }]
    const actions = renderSeat({ current: 'minimal', options }, undefined, undefined, false)
    expect(screen.getByRole('radio', { name: 'mine' })).toBeTruthy()
    act(() => { actions.store.set({ ...actions.store.getSnapshot(), options: [{ id: 'ptc' }, { id: 'minimal' }] }) })
    const current = screen.getByRole<HTMLButtonElement>('radio', { name: en.presetMinimalName })
    expect(current.disabled).toBe(true)
    expect(screen.queryByRole('radio', { name: 'mine' })).toBeNull()
    act(() => { actions.store.set({ ...actions.store.getSnapshot(), options }) })
    expect(screen.getByRole('radio', { name: 'mine' })).toHaveProperty('disabled', false)
    expect(actions.select).not.toHaveBeenCalled()
  })

  it('renders only for a Session retained by the main view', () => {
    renderSeat({}, undefined, {
      id: 's1', retainInfo: { referenceCount: 1, retainedBy: { mainView: 1 } },
    })
    expect(screen.getByRole('radiogroup')).toBeTruthy()
    cleanup()

    renderSeat({}, undefined, { id: 's1', retainInfo: undefined })
    expect(screen.queryByRole('radiogroup')).toBeNull()
  })

  it('reads the roster once and marks the staged preset', async () => {
    const actions = renderSeat()

    await waitFor(() => { expect(actions.load).toHaveBeenCalledTimes(1) })
    expect(screen.getByRole('radio', { name: en.presetStandardName }).getAttribute('aria-checked')).toBe('true')
    expect(screen.getByRole('radiogroup').getAttribute('title')).toBe(en.seatHint)
  })

  it('always shows the staged preset description in one dashed hint line with a leading bulb', () => {
    renderSeat()

    const group = screen.getByRole('radiogroup')
    const hintId = group.getAttribute('aria-describedby')
    expect(hintId).toBe('agent-preset-hint')
    const hint = document.getElementById(hintId!)
    expect(hint?.textContent).toBe(en.presetStandardDescription)
    expect(hint?.querySelectorAll('svg')).toHaveLength(1)

    cleanup()
    renderSeat({ current: 'mine' })
    expect(document.getElementById('agent-preset-hint')?.textContent).toBe(en.noDescription)
    expect(document.getElementById('agent-preset-hint')?.querySelectorAll('svg')).toHaveLength(1)
  })

  it('drops Coding Tools presets when Developer tools turn off without changing the staged preset', () => {
    const actions = renderSeat({ options: [
      { id: 'standard' }, { id: 'ptc' }, { id: 'minimal' }, { id: 'cordis' },
    ] })
    expect(screen.getByRole('radio', { name: en.presetPtcName })).toBeTruthy()
    act(() => { actions.developerTools.set(false) })
    expect(screen.queryByRole('radio', { name: en.presetPtcName })).toBeNull()
    expect(screen.getByRole('radio', { name: en.presetStandardName }).getAttribute('aria-checked')).toBe('true')
    expect(actions.select).not.toHaveBeenCalled()
  })

  it('falls back to the id when the staged preset published no name', () => {
    renderSeat({ current: 'mine' })

    expect(screen.getByRole('radio', { name: 'mine' }).getAttribute('aria-checked')).toBe('true')
  })

  it('keeps the roster options when the staged id is still arriving', () => {
    renderSeat({ current: 'arriving' })

    expect(screen.getByRole('radio', { name: en.presetStandardName }).getAttribute('aria-checked')).toBe('false')
    expect(screen.queryByRole('radio', { name: 'arriving' })).toBeNull()
  })

  it('stages the picked preset', () => {
    const actions = renderSeat()
    fireEvent.click(screen.getByRole('radio', { name: 'mine' }))

    expect(actions.select).toHaveBeenCalledWith('mine')
  })

  it('ignores a click on the already selected option', () => {
    const actions = renderSeat()
    fireEvent.click(screen.getByRole('radio', { name: en.presetStandardName }))
    expect(actions.select).not.toHaveBeenCalled()
  })

  it('disables every option while a switch is in flight', () => {
    renderSeat({ busy: true })

    for (const option of screen.getAllByRole('radio')) {
      expect(option).toHaveProperty('disabled', true)
    }
  })

  it('shows a refused switch on the segment', () => {
    renderSeat({ error: 'session has already started' })

    expect(screen.getByRole('radiogroup').getAttribute('title')).toBe('session has already started')
  })

  it('renders nothing before the roster arrives or when there is none', () => {
    const empty = renderSeat({ options: [] })
    expect(empty).toBeTruthy()
    expect(screen.queryByRole('radiogroup')).toBeNull()
    cleanup()

    renderSeat({ current: '' })
    expect(screen.queryByRole('radiogroup')).toBeNull()
  })
})

describe('a refused switch', () => {
  it('announces delayed and repeated refusals even without a composed preset or Coding Tools', () => {
    // The banner's own timer has to be a fake one from the start, or the
    // lifetime assertion below would wait out its real nine seconds.
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      const reason = 'failed to import loader entry live-on-mac (@deepseek-ai/dsh-also-gone)'
      const actions = renderSeat({ current: '' }, undefined, undefined, false)
      const refusal = { preset: { id: 'cordis' }, reason }
      act(() => { actions.store.set({ ...actions.store.getSnapshot(), error: refusal }) })

      // The host refuses a mount discovery reported healthy, so this banner is
      // the only place the cause appears — the chip has already reverted and
      // the settings row shows the preset as fine.
      const banner = screen.getByRole('alert')
      expect(banner.textContent).toContain(reason)
      expect(banner.textContent).toContain(en.presetCordisName)
      expect(screen.queryByRole('button')).toBeNull()

      act(() => { vi.advanceTimersByTime(7000) })
      act(() => { actions.store.set({ ...actions.store.getSnapshot(), error: { ...refusal } }) })
      act(() => { vi.advanceTimersByTime(2001) })
      expect(screen.getByRole('alert').textContent).toContain(reason)

      // Transient by design: it holds long enough to read a cause that names
      // packages, then leaves rather than sitting over the screen.
      act(() => { vi.advanceTimersByTime(9001) })
      expect(screen.queryByRole('alert')).toBeNull()
      expect(actions.dismissRefusal).toHaveBeenCalledOnce()
    } finally {
      vi.useRealTimers()
    }
  })

  it('says nothing when the switch lands', async () => {
    const actions = renderSeat()

    fireEvent.click(screen.getByRole('radio', { name: 'mine' }))

    await waitFor(() => { expect(actions.select).toHaveBeenCalledWith('mine') })
    expect(screen.queryByRole('alert')).toBeNull()
  })
})

describe('the segment introduce cue', () => {
  it('acknowledges a staged introduce as soon as the roster is ready', () => {
    const actions = renderSeat({ introduce: true })
    expect(actions.introduced).toHaveBeenCalledTimes(1)
  })

  it('waits for a ready roster before acknowledging', () => {
    const actions = renderSeat({ introduce: true, options: [], current: '' })
    expect(actions.introduced).not.toHaveBeenCalled()
  })
})

describe('the session-header label', () => {
  it('names the preset the session runs, and never offers a switch', async () => {
    const { load } = renderLabel({
      blank: false,
      projectionValues: { agentPreset: 'standard' },
    })

    await waitFor(() => { expect(load).toHaveBeenCalledTimes(1) })
    // A control here would promise a switch the host refuses outright.
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.getByTitle(en.presetStandardDescription).textContent).toBe(en.presetStandardName)
  })

  it('falls back to the id, and to the generic hint, when metadata is absent', () => {
    renderLabel({ blank: true, projectionValues: { agentPreset: 'mine' } })

    expect(screen.getByTitle(en.headerHint).textContent).toBe('mine')
  })

  it('shows the id until the roster resolves it', () => {
    renderLabel({
      blank: false,
      projectionValues: { agentPreset: 'standard' },
    }, { options: [] })

    // The session's own summary is the authority on which preset it runs; the
    // roster only supplies the display name, and its arrival is a later frame.
    expect(screen.getByTitle(en.headerHint).textContent).toBe('standard')
  })

  it('renders nothing, and reads no roster, when the session records no preset', async () => {
    const absent = renderLabel({ blank: true })
    expect(absent.view.container.firstChild).toBeNull()
    cleanup()

    // A session the list has not caught up to is the same answer: a deployment
    // that composes no presets must not pay for a roster read per header.
    const unknown = renderLabel(undefined)
    expect(unknown.view.container.firstChild).toBeNull()
    await act(async () => { await Promise.resolve() })
    expect(absent.load).not.toHaveBeenCalled()
    expect(unknown.load).not.toHaveBeenCalled()
  })
})
