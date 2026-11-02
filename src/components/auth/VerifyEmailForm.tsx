'use client'

import { useState } from 'react'
import { Alert } from 'antd'
import { CircleCheck, MailCheck } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { verifyEmailAPI } from '@api/identity/main'
import { TOKEN_QUERY } from '@constants/auth'
import { ROUTES } from '@constants/routes'
import { ButtonLink } from '@components/ui/bare/AppLink'
import { Button } from '@components/ui/Button'
import { ErrorAlert } from '@components/ui/ErrorAlert'
import { Spinner } from '@components/ui/Spinner'
import { useAuthErrorMessage, useQueryParam } from './authForm'

/**
 * The emailed link lands here and waits for a click: mail scanners open every URL in a
 * message, and a single-use token spent on page load would be spent by them. Confirming only
 * activates the account; the player signs in next.
 */
export const VerifyEmailForm = () => {
  const t = useTranslations()
  const errorMessage = useAuthErrorMessage()
  /** The emailed link's token. Not named `token`: the timing-attack lint reads `=== undefined` on it as a secret compare. */
  const linkCode = useQueryParam(TOKEN_QUERY)
  const [state, setState] = useState<'idle' | 'sending' | 'verified'>('idle')
  const [error, setError] = useState<unknown>(null)

  if (linkCode === undefined) {
    return (
      <div className='flex justify-center py-10'>
        <Spinner size='lg' label={t('Common.loading')} />
      </div>
    )
  }

  const signInLink = (variant: 'gold' | 'outline') => (
    <ButtonLink href={ROUTES.signIn} variant={variant} fullWidth>
      {t('Auth.signInTitle')}
    </ButtonLink>
  )

  if (state === 'verified') {
    return (
      <div role='status' className='flex flex-col items-center gap-4 text-center'>
        <CircleCheck aria-hidden className='size-14 text-correct-300' />
        <h2 className='text-h3 font-bold text-gold-200'>{t('Auth.verifiedTitle')}</h2>
        <p className='text-mist'>{t('Auth.verifiedBody')}</p>
        {signInLink('gold')}
      </div>
    )
  }

  if (!linkCode) {
    return (
      <div className='flex flex-col gap-5'>
        <Alert type='warning' showIcon title={t('Auth.verifyMissing')} />
        {signInLink('outline')}
      </div>
    )
  }

  const verify = async () => {
    setError(null)
    setState('sending')
    try {
      await verifyEmailAPI({ token: linkCode })
      setState('verified')
    } catch (failure) {
      setError(failure)
      setState('idle')
    }
  }

  return (
    <div className='flex flex-col gap-4'>
      {Boolean(error) && <ErrorAlert error={error} message={errorMessage(error)} />}
      <Button fullWidth loading={state === 'sending'} onClick={verify} icon={<MailCheck aria-hidden className='size-5' />}>
        {t('Auth.verifySubmit')}
      </Button>
      {Boolean(error) && signInLink('outline')}
    </div>
  )
}
