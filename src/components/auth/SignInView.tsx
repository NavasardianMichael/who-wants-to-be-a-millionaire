'use client'

import { Check } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ROUTES } from '@constants/routes'
import { AppLink } from '@components/ui/bare/AppLink'
import { AuthGate } from './AuthGate'
import { GoogleOption } from './GoogleOption'
import { SignInForm } from './SignInForm'

/** Google, then email and password, then why an account is worth having. */
export const SignInView = () => {
  const t = useTranslations('Auth')
  const benefits = [t('benefitRanked'), t('benefitLeaderboard'), t('benefitSync')]

  return (
    <AuthGate>
      <div className='flex flex-col gap-6'>
        <GoogleOption />
        <SignInForm />
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
        <p className='text-center text-body-sm text-mist'>
          {t('noAccount')}{' '}
          <AppLink href={ROUTES.signUp} className='font-semibold text-gold-200 underline-offset-4 hover:underline'>
            {t('signUpTitle')}
          </AppLink>
        </p>
      </div>
    </AuthGate>
  )
}
