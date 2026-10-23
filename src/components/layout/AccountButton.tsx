'use client'

import { useTranslations } from 'next-intl'
import { useAuthStore } from '@store/auth/store'
import { ROUTES } from '@constants/routes'
import { AppLink } from '@components/ui/bare/AppLink'
import { Avatar } from '@components/ui/bare/Avatar'
import { Skeleton } from '@components/ui/bare/Skeleton'
import { GoogleSignInButton } from './GoogleSignInButton'

/**
 * Signed in → the avatar, linking to the profile. Signed out → "Sign in" (only when the API
 * can offer Google at all). Until the session resolves, a placeholder of the same size, so
 * the header does not jump.
 */
export const AccountButton = () => {
  const user = useAuthStore.use.user()
  const isResolved = useAuthStore.use.isResolved()
  const googleAvailable = useAuthStore.use.googleAvailable()
  const t = useTranslations('Nav')

  if (!isResolved) return <Skeleton className='hidden size-11 rounded-full sm:block' />

  if (user) {
    return (
      <AppLink href={ROUTES.profile} aria-label={t('profile')} className='hidden rounded-full sm:block'>
        <Avatar name={user.displayName} url={user.avatarUrl} size='md' className='size-11' />
      </AppLink>
    )
  }

  return googleAvailable ? <GoogleSignInButton compact className='hidden sm:inline-flex' /> : null
}
