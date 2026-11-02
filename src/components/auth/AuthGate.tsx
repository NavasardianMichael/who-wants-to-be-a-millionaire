'use client'

import type { ReactNode } from 'react'
import { Trophy, User } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useAuthStore } from '@store/auth/store'
import { ROUTES } from '@constants/routes'
import { ButtonLink } from '@components/ui/bare/AppLink'
import { Avatar } from '@components/ui/bare/Avatar'
import { Spinner } from '@components/ui/Spinner'

/**
 * The sign-in and sign-up pages before their form: nothing until the session resolves, then
 * — when already signed in, which is also where Google's redirect and a password sign-in
 * land — who you are and where to go next.
 */
export const AuthGate = ({ children }: { children: ReactNode }) => {
  const t = useTranslations()
  const user = useAuthStore.use.user()
  const isResolved = useAuthStore.use.isResolved()

  if (!isResolved) {
    return (
      <div className='flex justify-center py-10'>
        <Spinner size='lg' label={t('Common.loading')} />
      </div>
    )
  }

  if (!user) return children

  return (
    <div className='flex flex-col items-center gap-5 text-center'>
      <Avatar name={user.displayName} url={user.avatarUrl} size='xl' className='shadow-glow-gold' />
      <p className='text-h3 font-bold text-ivory'>{t('Auth.alreadySignedIn', { name: user.displayName })}</p>
      <div className='flex w-full flex-col gap-3 sm:flex-row sm:justify-center'>
        <ButtonLink href={ROUTES.marathon}>
          <Trophy aria-hidden className='size-5' />
          {t('Nav.marathon')}
        </ButtonLink>
        <ButtonLink href={ROUTES.profile} variant='outline'>
          <User aria-hidden className='size-5' />
          {t('Nav.profile')}
        </ButtonLink>
      </div>
    </div>
  )
}
