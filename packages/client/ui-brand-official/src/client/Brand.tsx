import type { SidebarRootComponentProps } from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type { HeroBrandMarkOwnerProps } from '@deepseek-ai/dsh-client-ui-conversation/client'
import { BrandLogo } from '@deepseek-ai/dsh-client-ui-primitives'

/**
 * Render the official mark with the presentation requested by its host surface.
 * @param props - Host-supplied mark presentation.
 * @returns the six-petal flower.
 */
export function OfficialBrandMark(props: HeroBrandMarkOwnerProps) {
  return <BrandLogo {...props} />
}

/**
 * Render the localized product name beside the independently slotted mark.
 * @param props - Sidebar translation function.
 * @returns The localized Lingxi Office name.
 */
export function OfficialBrandName({ t }: Pick<SidebarRootComponentProps, 't'>) {
  return <>{t('brand.name')}</>
}
