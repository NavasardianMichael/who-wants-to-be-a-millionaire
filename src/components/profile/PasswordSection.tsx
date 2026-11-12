'use client'

import { useState } from 'react'
import { KeyRound } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { sendPasswordLinkAPI } from '@api/identity/main'
import type { SessionUser } from '@interfaces/entities'
import { Button } from '@components/ui/Button'
import { ErrorAlert } from '@components/ui/ErrorAlert'

/**
 * Setting a first password (a Google account) or changing one goes through the mailbox, by the
 * same one-hour link as a forgotten password — an unlocked session alone is not enough.
 */
export const PasswordSection = ({ user }: { user: SessionUser }) => {
  const t = useTranslations('Profile')
  const locale = useLocale()
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState<unknown>(null)

  const send = async () => {
    setError(null)
    setState('sending')
    try {
      await sendPasswordLinkAPI({ locale })
      setState('sent')
    } catch (failure) {
      setError(failure)
      setState('idle')
    }
  }

  return (
    <section aria-labelledby='password-title' className='flex w-full flex-col gap-2 border-t border-line-subtle pt-4 text-start'>
      <h2 id='password-title' className='text-body-sm font-bold text-ivory'>
        {t('passwordTitle')}
      </h2>
      {state === 'sent' ? (
        <p role='status' className='text-body-sm text-correct-300 break-words'>
          {t('passwordLinkSent', { email: user.email })}
        </p>
      ) : (
        <>
          <p className='text-caption text-mist'>{user.hasPassword ? t('passwordChangeBody') : t('passwordSetBody')}</p>
          {Boolean(error) && <ErrorAlert error={error} />}
          <Button
            variant='secondary'
            size='sm'
            loading={state === 'sending'}
            onClick={send}
            icon={<KeyRound aria-hidden className='size-4' />}
            className='self-start'
          >
            {user.hasPassword ? t('passwordChange') : t('passwordSet')}
          </Button>
        </>
      )}
    </section>
  )
}
