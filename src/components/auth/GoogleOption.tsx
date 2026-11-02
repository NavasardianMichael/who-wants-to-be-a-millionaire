'use client'

import { useTranslations } from 'next-intl'
import { useAuthStore } from '@store/auth/store'
import { GoogleSignInButton } from '@components/layout/GoogleSignInButton'
import { OrDivider } from './OrDivider'

/** Google first, then "or" before the email form. Absent while the API cannot offer Google. */
export const GoogleOption = () => {
  const t = useTranslations('Auth')
  const googleAvailable = useAuthStore.use.googleAvailable()
  if (!googleAvailable) return null

  return (
    <>
      <div className='flex flex-col gap-2'>
        <GoogleSignInButton className='w-full' />
        <p className='text-center text-caption text-mist'>{t('privacyNote')}</p>
      </div>
      <OrDivider />
    </>
  )
}
