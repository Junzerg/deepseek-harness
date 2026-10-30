/** Host configuration for browser entry customization. */
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-host-webserver'
import type { Config } from './config.ts'
import { ENTRY_CUSTOMIZATION_CONFIG_GLOBAL } from './config.ts'

export { Config } from './config.ts'

/**
 * Embed validated entry customization controls in browser pages.
 * @param ctx - Host context serving browser pages.
 * @param config - menu actions enabled by this deployment.
 */
export function apply(ctx: Context, config: Config): void {
  ctx.on('webserver/index-inject', (table) => {
    table.push({ kind: 'global', name: ENTRY_CUSTOMIZATION_CONFIG_GLOBAL, value: config })
  })
}
