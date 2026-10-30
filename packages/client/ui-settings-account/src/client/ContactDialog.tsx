/** Internal feedback contact notice. */
import { Button, IconCloseOutlineRegular, Modal } from '@deepseek-ai/dsh-client-ui-primitives'
import type { AccountKey } from './locales.ts'
import css from './SignInDialog.module.css'

/** @param props - localized copy and dismissal action. @returns the internal feedback contact dialog. */
export function ContactDialog({ close, t }: {
  close: () => void
  t: (key: AccountKey) => string
}) {
  return <Modal open headless title={t('contactUs')} onClose={close} className={css.dialog as string}>
    <div className={css.content}>
      <div className={css.header}>
        <h2 className={css.title}>{t('contactUs')}</h2>
        <button type="button" className={css.close} aria-label={t('close')} onClick={close}>
          <IconCloseOutlineRegular size={14} />
        </button>
      </div>
      <p className={css.description}>{t('contactInternalDescription')}</p>
    </div>
    <div className={css.actions}>
      <Button variant="primary" className={css.primaryButton} onClick={close}>{t('close')}</Button>
    </div>
  </Modal>
}
