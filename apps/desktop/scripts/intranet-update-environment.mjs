/** Resolve an explicitly configured unsigned Windows update feed. */

/**
 * Validate the intranet feed URL; omission retains the ordinary release mode.
 * HTTP transport trusts the internal network and does not authenticate downloaded code.
 * @param {NodeJS.ProcessEnv} environment File-owned packaging settings.
 * @returns {string | undefined} Absolute feed directory URL.
 */
export function resolveIntranetUpdateUrl(environment) {
  const value = environment.DSH_DESKTOP_INTRANET_UPDATE_URL
  if (value === undefined) return undefined
  let url
  try { url = new URL(value) }
  catch { throw new Error('desktop package: DSH_DESKTOP_INTRANET_UPDATE_URL requires an HTTP(S) feed directory URL') }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new Error('desktop package: intranet update URL must use HTTP(S) without credentials, query, or fragment')
  }
  if (!url.pathname.endsWith('/')) url.pathname += '/'
  return url.href
}
