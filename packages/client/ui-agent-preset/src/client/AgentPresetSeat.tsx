/**
 * The agent-preset segment on the new-session screen, under the hero title.
 *
 * It lives here rather than in the composer because the choice is only
 * available before a conversation starts: once a turn has run, the session's
 * history was produced under that preset's tools, and the host refuses to swap
 * them. A control that spends most of its life disabled belongs on the screen
 * where it still works.
 *
 * The segment opens on the staged choice, which starts as the deployment
 * default. Picking stages; the choice reaches a session when one becomes
 * current. Below the track, a dashed note always shows the staged preset's
 * description (workbench homeScenes tip), with a single leading bulb.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import type { ObservableSnapshot, SnapshotStore } from '@deepseek-ai/dsh-client-store'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import {
  IconAgentPresetOutlineRegular, IconCodeOutlineRegular, IconDeliverDocRegular,
  IconSparkleRegular, IconThinkOutlineRegular, IconWarningOutlineRegular, Toast,
} from '@deepseek-ai/dsh-client-ui-primitives'
// Type-only: pulls the ui-conversation SlotMap merge (the hero seat).
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { AgentPresetSeatState } from './seat-store.ts'
import { presetDisplayText } from './locales.ts'
import { requiresCodingTools } from './settings-store.ts'
import css from './AgentPresetSeat.module.css'

/** Registration-side business face for the hero segment. */
export interface AgentPresetSeatInjected {
  hooks: {
    /** Shared Developer tools preference; off hides the PTC and Minimal choices. */
    developerTools: ObservableSnapshot<boolean>
    /** Seat snapshot bound by the renderer as useAgentPresetSeat. */
    agentPresetSeat: SnapshotStore<AgentPresetSeatState>
  }
  /** Read the roster when the segment first renders. */
  load: () => Promise<void>
  /** Stage one preset for the next session; resolves to a refusal, or undefined. */
  select: (id: string) => Promise<string | undefined>
  /** Acknowledge the refusal whose Toast finished. */
  dismissRefusal: (error: AgentPresetSeatState['error']) => void
  /** Clear the one-shot introduce cue once the segment has acknowledged it. */
  introduced: () => void
}

/** Duration of a selection-refusal banner, including a revision becoming unavailable during a pick. */
const REFUSAL_HOLD_MS = 8000

/** Full component props. */
export type AgentPresetSeatProps =
  PropsRuntime<'conversation.hero.agentPreset'>
  & PropsLocale<'settings.agentPreset'>
  & InjectFace<AgentPresetSeatInjected>

/** Workbench homeScenes bulb glyph (14px), stroked to match the prototype tip. */
function HintBulb() {
  return (
    <svg
      className={css.bulb}
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 17.5h6M10 20.5h4M12 3.5a5.5 5.5 0 0 1 3.4 9.8c-.6.5-1 1.2-1 2h-4.8c0-.8-.4-1.5-1-2A5.5 5.5 0 0 1 12 3.5z" />
    </svg>
  )
}

/**
 * 15px mark in front of a segment label, matching the workbench `.seg` buttons.
 * Built-in ids get a mode glyph; anything else uses the preset mark.
 */
function presetMark(id: string) {
  const size = 15
  switch (id) {
    case 'standard': return <IconDeliverDocRegular size={size} />
    case 'ptc': return <IconCodeOutlineRegular size={size} />
    case 'minimal': return <IconThinkOutlineRegular size={size} />
    case 'cordis': return <IconSparkleRegular size={size} />
    default: return <IconAgentPresetOutlineRegular size={size} />
  }
}

/**
 * Render the new-session agent-preset segment.
 * @param props - composed slot props.
 * @returns The segment and any pending selection refusal, or null outside the main view.
 */
export function AgentPresetSeat({
  sessionId, useSessionRetainInfo, load, select, dismissRefusal, introduced, useAgentPresetSeat, useDeveloperTools, t,
}: AgentPresetSeatProps) {
  const developerTools = useDeveloperTools(value => value)
  const state = useAgentPresetSeat(snapshot => snapshot)
  const main = useSessionRetainInfo(info => sessionId === undefined
    || (info?.retainedBy.mainView ?? 0) > 0)
  // The seq keys the banner, so picking the same broken preset twice replays
  // it rather than leaving the first one silently in place.
  const toastSeq = useRef(0)
  const [toast, setToast] = useState<{ seq: number; error: Exclude<AgentPresetSeatState['error'], string | null> } | null>(null)

  useEffect(() => {
    if (state.error !== null && typeof state.error === 'object') {
      toastSeq.current += 1
      setToast({ seq: toastSeq.current, error: state.error })
    } else setToast(null)
  }, [state.error])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(
    () => state.options.filter(option => developerTools || !requiresCodingTools(option)),
    [state.options, developerTools],
  )
  // Coding Tools off can hide every row; keep the staged choice on screen as a
  // locked segment so the blank home still names what the next session runs.
  const options = filtered.length > 0
    ? filtered
    : state.options.filter(option => option.id === state.current)
  const locked = filtered.length === 0 && options.length > 0
  const ready = state.options.length > 0 && state.current !== ''

  const current = options.find(option => option.id === state.current) ?? options[0]
  const hintText = current === undefined
    ? t('noDescription')
    : (presetDisplayText(current, t).description ?? t('noDescription'))
  const hintId = 'agent-preset-hint'

  // A pick staged from another screen (settings creator) still needs the cue
  // cleared once this surface has the roster; the segment has no per-character
  // introduce motion.
  useEffect(() => {
    if (state.introduce && ready) introduced()
  }, [state.introduce, ready, introduced])

  // A refused initial composition still needs its Toast when there is no segment to show.
  if (!main) return null
  if (!ready || options.length === 0) {
    return toast !== null
      ? (
        <Toast
          key={toast.seq}
          text={t('switchRefused', { name: presetDisplayText(toast.error.preset, t).name, reason: toast.error.reason })}
          icon={<IconWarningOutlineRegular />}
          holdMs={REFUSAL_HOLD_MS}
          anchor={document.querySelector<HTMLElement>('[data-composer-card]')}
          onDone={() => { dismissRefusal(toast.error) }}
        />
      )
      : null
  }

  const refusalTitle = typeof state.error === 'object' ? state.error?.reason : state.error

  return (
    <>
      <div className={css.root}>
        <div
          role="radiogroup"
          aria-label={t('seatHint')}
          aria-describedby={hintId}
          className={css.seg}
          title={refusalTitle ?? t('seatHint')}
        >
          {options.map((option) => {
            const text = presetDisplayText(option, t)
            const selected = option.id === state.current
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={selected}
                className={selected ? `${css.option} ${css.on}` : css.option}
                disabled={state.busy || locked}
                onClick={() => {
                  if (selected || locked) return
                  void select(option.id)
                }}
              >
                <span className={css.mark} aria-hidden>{presetMark(option.id)}</span>
                {text.name}
              </button>
            )
          })}
        </div>
        <div id={hintId} className={css.hint} aria-live="polite">
          <HintBulb />
          <span className={css.hintText}>{hintText}</span>
        </div>
      </div>
      {toast !== null && (
        <Toast
          key={toast.seq}
          text={t('switchRefused', { name: presetDisplayText(toast.error.preset, t).name, reason: toast.error.reason })}
          icon={<IconWarningOutlineRegular />}
          holdMs={REFUSAL_HOLD_MS}
          // The composer card, which is the content column this segment sits
          // above rather than inside — hence a page query, not `closest`.
          // Absent, the banner centers on the window, which is off-center
          // whenever the sidebar is open.
          anchor={document.querySelector<HTMLElement>('[data-composer-card]')}
          onDone={() => { dismissRefusal(toast.error) }}
        />
      )}
    </>
  )
}
