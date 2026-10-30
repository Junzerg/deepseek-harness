/** Fixed column geometry; narrow frames show the right panel as an overlay. */
export interface Columns { sidebar: number; center: number; rightbar: number }

/** Expanded navigation width in CSS pixels. */
export const SIDEBAR_DEFAULT = 236
/** Normal right panel width in CSS pixels, including overlay presentation. */
export const RIGHTBAR_WIDTH = 336
/** Largest viewport width that overlays the right panel instead of reserving a column. */
export const RIGHTBAR_OVERLAY_BREAKPOINT = 1180

/**
 * Resolve reserved column widths. An overlay retains its full panel width
 * while reserving zero space beside the main column.
 * @param viewport - frame width in px.
 * @param rightbarTrack - whether the right panel requests space.
 * @returns reserved widths for the three columns.
 */
export function computeColumns(
  viewport: number, rightbarTrack: boolean,
): Columns {
  const sidebar = SIDEBAR_DEFAULT
  const rightbar = rightbarTrack && viewport > RIGHTBAR_OVERLAY_BREAKPOINT ? RIGHTBAR_WIDTH : 0
  return { sidebar, center: Math.max(0, viewport - sidebar - rightbar), rightbar }
}
