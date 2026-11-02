'use client'

import { type ReactNode, useState } from 'react'
import { Alert } from 'antd'
import { useLocale, useTranslations } from 'next-intl'
import { resendVerificationAPI } from '@api/identity/main'
import { Button } from '@components/ui/Button'
import { ErrorAlert } from '@components/ui/ErrorAlert'

type Props = {
  email: string
  /** `sent` right after sign-up; `unverified` when a sign-in is refused for it. */
  variant: 'sent' | 'unverified'
}

/** An account waiting for its emailed link, with a way to have the link sent again. */
export const VerificationNotice = ({ email, variant }: Props) => {
  const t = useTranslations('Auth')
  const locale = useLocale()
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState<unknown>(null)

  const resend = async () => {
    setError(null)
    setState('sending')
    try {
      await resendVerificationAPI({ email, locale })
      setState('sent')
    } catch (failure) {
      setError(failure)
      setState('idle')
    }
  }

  const bold = (chunks: ReactNode) => <strong className='break-all text-ivory'>{chunks}</strong>

  return (
    <div className='flex flex-col gap-4'>
      <Alert
        type={variant === 'sent' ? 'success' : 'warning'}
        showIcon
        title={t(variant === 'sent' ? 'checkInboxTitle' : 'unverifiedTitle')}
        description={t.rich(variant === 'sent' ? 'checkInboxBody' : 'unverifiedBody', { email, b: bold })}
      />
      <p className='text-body-sm text-mist'>{t('checkInboxSpam')}</p>
      {state === 'sent' && <Alert role='status' type='info' showIcon title={t('resendSent')} />}
      {Boolean(error) && <ErrorAlert error={error} />}
      <Button variant='outline' fullWidth loading={state === 'sending'} onClick={resend}>
        {t('resendVerification')}
      </Button>
    </div>
  )
}
