/** Deployment controls for plugin discovery and authoring menu rows. */
import z from '@deepseek-ai/schemastery'

/** Menu actions enabled by the current deployment. */
export interface Config {
  /** Show the action that opens the plugin browser. */
  showBrowsePlugins: boolean
  /** Show the action that prepares a plugin-authoring draft. */
  showCreatePlugin: boolean
}

/** Validate deployment-specific entry customization controls. */
export const Config: z<Partial<Config>, Config> = z.object({
  showBrowsePlugins: z.boolean().default(true),
  showCreatePlugin: z.boolean().default(true),
})

/** Bootstrap key containing public entry customization controls. */
export const ENTRY_CUSTOMIZATION_CONFIG_GLOBAL = '__DSH_ENTRY_CUSTOMIZATION_CONFIG__'
