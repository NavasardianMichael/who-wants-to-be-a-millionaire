'use client'

import { LogIn } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useAuthStore } from '@store/auth/store'
import { ROUTES } from '@constants/routes'
import { AppLink, ButtonLink } from '@components/ui/bare/AppLink'
import { Avatar } from '@components/ui/bare/Avatar'
import { Skeleton } from '@components/ui/bare/Skeleton'

/**
 * Signed in → the avatar, linking to the profile. Signed out → "Sign in", linking to the
 * sign-in page. Until the session resolves, a placeholder of the same size, so the header
 * does not jump. Below `sm` both live in the menu drawer.
 */
export const AccountButton = () => {
  const user = useAuthStore.use.user()
  const isResolved = useAuthStore.use.isResolved()
  const t = useTranslations()

  if (!isResolved) return <Skeleton className='hidden size-11 rounded-full sm:block' />

  if (user) {
    return (
      <AppLink href={ROUTES.profile} aria-label={t('Nav.profile')} className='hidden rounded-full sm:block'>
        <Avatar name={user.displayName} url={user.avatarUrl} size='md' className='size-11' />
      </AppLink>
    )
  }

  return (
    <ButtonLink href={ROUTES.signIn} size='sm' className='hidden sm:inline-flex'>
      <LogIn aria-hidden className='size-4 rtl:-scale-x-100' />
      {t('Common.signIn')}
    </ButtonLink>
  )
}
