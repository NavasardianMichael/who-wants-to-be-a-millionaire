'use client'

import { useState } from 'react'
import { Alert, Form, Input } from 'antd'
import { Send } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { forgotPasswordAPI } from '@api/identity/main'
import { ROUTES } from '@constants/routes'
import { AppLink } from '@components/ui/bare/AppLink'
import { Button } from '@components/ui/Button'
import { ErrorAlert } from '@components/ui/ErrorAlert'

/**
 * Asks for a reset link. The answer is the same whether or not the address has an account,
 * so the form cannot be used to find out who plays here.
 */
export const ForgotPasswordForm = () => {
  const t = useTranslations('Auth')
  const locale = useLocale()
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState<unknown>(null)

  const onFinish = async ({ email }: { email: string }) => {
    setError(null)
    setState('sending')
    try {
      await forgotPasswordAPI({ email: email.trim(), locale })
      setState('sent')
    } catch (failure) {
      setError(failure)
      setState('idle')
    }
  }

  const backLink = (
    <AppLink href={ROUTES.signIn} className='text-center text-body-sm font-semibold text-gold-200 underline-offset-4 hover:underline'>
      {t('backToSignIn')}
    </AppLink>
  )

  if (state === 'sent') {
    return (
      <div className='flex flex-col gap-5'>
        <Alert role='status' type='success' showIcon title={t('forgotSent')} />
        <p className='text-body-sm text-mist'>{t('checkInboxSpam')}</p>
        {backLink}
      </div>
    )
  }

  return (
    <Form<{ email: string }>
      layout='vertical'
      requiredMark={false}
      onFinish={onFinish}
      disabled={state === 'sending'}
      className='flex flex-col gap-1 [&_.ant-form-item-label>label]:font-semibold'
    >
      <Form.Item
        name='email'
        label={t('email')}
        rules={[
          { required: true, message: t('required') },
          { type: 'email', message: t('invalidEmail') },
        ]}
      >
        <Input size='large' type='email' inputMode='email' autoComplete='email' />
      </Form.Item>
      {Boolean(error) && <ErrorAlert error={error} className='mb-4' />}
      <Button type='submit' fullWidth loading={state === 'sending'} icon={<Send aria-hidden className='size-5 rtl:-scale-x-100' />}>
        {t('forgotSubmit')}
      </Button>
      <div className='mt-4 flex justify-center'>{backLink}</div>
    </Form>
  )
}
