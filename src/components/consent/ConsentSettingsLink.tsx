'use client'

import { useTranslations } from 'next-intl'
import { GA_ENABLED } from '@constants/analytics'
import { openConsentBanner } from '@helpers/consent'

/** The footer's way back to the analytics banner, to change the answer. Nothing without a GA tag. */
export const ConsentSettingsLink = ({ className }: { className?: string }) => {
  const t = useTranslations('Consent')
  if (!GA_ENABLED) return null
  return (
    <button type='button' className={className} onClick={openConsentBanner}>
      {t('settings')}
    </button>
  )
}
