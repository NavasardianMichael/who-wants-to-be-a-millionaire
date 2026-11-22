'use client'

import { useLocale, useTranslations } from 'next-intl'
import { googleSignInUrl } from '@api/identity/main'
import type { Locale } from '@i18n/config'
import { usePathname } from '@i18n/navigation'
import { localePath } from '@i18n/pathname'
import { trackEvent } from '@helpers/analytics'
import { GoogleMark } from '@components/brand/GoogleMark'
import { buttonClassName } from '@components/ui/bare/buttonClassName'

/**
 * A top-level navigation to the API, which runs the Google flow and redirects back to this
 * page. Not an XHR: the session cookie is set on that redirect.
 */
export const GoogleSignInButton = ({ compact, className }: { compact?: boolean; className?: string }) => {
  const t = useTranslations('Common')
  const locale = useLocale() as Locale
  const pathname = usePathname()

  return (
    <a
      href={googleSignInUrl(localePath(locale, pathname))}
      onClick={() => trackEvent('sign_in_clicked')}
      className={buttonClassName({ variant: 'ivory', size: compact ? 'sm' : 'md', className })}
    >
      <GoogleMark />
      {compact ? t('signIn') : t('signInWithGoogle')}
    </a>
  )
}
