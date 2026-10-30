/**
 * Validate an optional unsigned Windows intranet feed URL.
 * @param environment File-owned packaging settings.
 * @returns Absolute HTTP(S) feed directory URL, or undefined when omitted.
 */
export function resolveIntranetUpdateUrl(environment: NodeJS.ProcessEnv): string | undefined
