'use client'

import { useSyncExternalStore } from 'react'
import { X } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { usePathname } from '@i18n/navigation'
import { ADSENSE_ENABLED } from '@constants/ads'
import { ROUTES } from '@constants/routes'
import { adsAllowedOn } from '@helpers/ads'
import { isConsentBannerOpen, saveConsent, subscribeConsentBanner } from '@helpers/consent'
import { AppLink } from '@components/ui/bare/AppLink'
import { Button } from '@components/ui/Button'
import { IconButton } from '@components/ui/IconButton'

/**
 * Asks once whether Google Analytics may set its cookies — only where an opt-in is needed
 * (`helpers/consent.ts`); elsewhere they are on from the start. Until the visitor answers,
 * analytics runs cookieless. Closing it counts as accepting, and the text says so. Comes back
 * from "Cookie settings" in the footer. Not a modal: the page stays usable while it is open.
 *
 * Hidden on a game screen, like the footer, so it never covers an answer; until the visitor
 * answers, the default (denied) holds there too. On a page with ads, Google's own consent message
 * goes first and its answer is taken over (`followGoogleConsent`): one question, never two at once.
 */
export const ConsentBanner = () => {
  const t = useTranslations('Consent')
  const tCommon = useTranslations('Common')
  const locale = useLocale()
  const pathname = usePathname()
  const adPage = ADSENSE_ENABLED && adsAllowedOn(locale, pathname)
  // Closed in the server render: the answer lives in the browser.
  const open = useSyncExternalStore(subscribeConsentBanner, () => isConsentBannerOpen(adPage), () => false)

  if (!open) return null

  return (
    <section
      aria-label={t('label')}
      className='fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] [body:has([data-game-stage])_&]:hidden'
    >
      <div className='relative mx-auto flex max-w-3xl flex-col gap-3 rounded-lg border border-spot-300/20 bg-studio-950/95 p-4 pe-14 shadow-xl backdrop-blur sm:flex-row sm:items-center sm:gap-4'>
        <p className='text-body-sm text-mist'>
          {t('text')}{' '}
          <AppLink href={ROUTES.privacy} className='font-semibold text-gold-200 underline underline-offset-2'>
            {t('privacy')}
          </AppLink>
        </p>
        <div className='flex shrink-0 gap-2 sm:ms-auto'>
          <Button variant='secondary' size='sm' className='flex-1 sm:flex-none' onClick={() => saveConsent('denied')}>
            {t('decline')}
          </Button>
          <Button size='sm' className='flex-1 sm:flex-none' onClick={() => saveConsent('granted')}>
            {t('accept')}
          </Button>
        </div>
        {/* Last in the tab order; closing counts as accepting, as the text says. */}
        <IconButton
          label={tCommon('close')}
          tooltip={false}
          icon={<X aria-hidden className='size-5' />}
          className='absolute inset-e-1 top-1'
          onClick={() => saveConsent('granted')}
        />
      </div>
    </section>
  )
}
