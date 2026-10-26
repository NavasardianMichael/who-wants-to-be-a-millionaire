'use client'

import { Check, Trophy, User } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useAuthStore } from '@store/auth/store'
import { ROUTES } from '@constants/routes'
import { GoogleSignInButton } from '@components/layout/GoogleSignInButton'
import { ButtonLink } from '@components/ui/bare/AppLink'
import { Avatar } from '@components/ui/bare/Avatar'
import { Spinner } from '@components/ui/Spinner'

/**
 * Google is the only way in, so the page is one button and why it is worth pressing. Signed
 * in already (also where the Google redirect lands back), it says so and points onward.
 * Without Google configured on the API it explains that Classic still plays, saved locally.
 */
export const SignInView = () => {
  const t = useTranslations()
  const user = useAuthStore.use.user()
  const isResolved = useAuthStore.use.isResolved()
  const googleAvailable = useAuthStore.use.googleAvailable()

  if (!isResolved) {
    return (
      <div className='flex justify-center py-10'>
        <Spinner size='lg' label={t('Common.loading')} />
      </div>
    )
  }

  if (user) {
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

  const benefits = [t('Auth.benefitRanked'), t('Auth.benefitLeaderboard'), t('Auth.benefitSync')]

  return (
    <div className='flex flex-col gap-6'>
      <ul className='flex flex-col gap-3'>
        {benefits.map((benefit) => (
          <li key={benefit} className='flex items-start gap-3 text-ivory'>
            <span className='mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-tag bg-gold-400/15 text-gold-300'>
              <Check aria-hidden className='size-4' />
            </span>
            {benefit}
          </li>
        ))}
      </ul>
      {googleAvailable ? (
        <>
          <GoogleSignInButton className='w-full' />
          <p className='text-center text-caption text-mist'>{t('Auth.privacyNote')}</p>
        </>
      ) : (
        <p className='rounded-control border border-lock-500/40 bg-lock-500/10 p-4 text-body-sm text-lock-300'>{t('Auth.unavailable')}</p>
      )}
    </div>
  )
}
