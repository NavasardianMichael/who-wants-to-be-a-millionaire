'use client'

import { useState } from 'react'
import { Form, Input } from 'antd'
import { LogIn } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useAuthStore } from '@store/auth/store'
import { toast } from '@store/toast/store'
import { ROUTES } from '@constants/routes'
import { AppLink } from '@components/ui/bare/AppLink'
import { Button } from '@components/ui/Button'
import { ErrorAlert } from '@components/ui/ErrorAlert'
import { authErrorKey, useAuthErrorMessage } from './authForm'
import { VerificationNotice } from './VerificationNotice'

type Values = { email: string; password: string }

/**
 * Email and password. Success needs no redirect: the session lands in the store and the page
 * turns into its signed-in state. An account that has not opened its verification link is
 * told so — only once the password matched, so it reveals nothing to a stranger.
 */
export const SignInForm = () => {
  const t = useTranslations('Auth')
  const login = useAuthStore.use.login()
  const errorMessage = useAuthErrorMessage()
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<unknown>(null)
  /** The address of an account that exists but has not opened its verification link. */
  const [unverified, setUnverified] = useState<string | null>(null)

  const onFinish = async ({ email, password }: Values) => {
    setError(null)
    setUnverified(null)
    setIsSending(true)
    try {
      const user = await login({ email: email.trim(), password })
      toast(t('signedIn', { name: user.displayName }), 'success')
    } catch (failure) {
      if (authErrorKey(failure) === 'emailNotVerified') setUnverified(email.trim())
      else setError(failure)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Form<Values>
      layout='vertical'
      requiredMark={false}
      onFinish={onFinish}
      disabled={isSending}
      className='flex flex-col [&_.ant-form-item-label>label]:font-semibold'
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
      <Form.Item name='password' label={t('password')} rules={[{ required: true, message: t('required') }]}>
        <Input.Password size='large' autoComplete='current-password' />
      </Form.Item>
      <AppLink href={ROUTES.forgotPassword} className='-mt-3 mb-5 self-end text-body-sm font-semibold text-gold-200 underline-offset-4 hover:underline'>
        {t('forgot')}
      </AppLink>

      {Boolean(error) && <ErrorAlert error={error} message={errorMessage(error)} className='mb-4' />}
      {unverified && (
        <div className='mb-4'>
          <VerificationNotice variant='unverified' email={unverified} />
        </div>
      )}

      <Button type='submit' fullWidth loading={isSending} icon={<LogIn aria-hidden className='size-5 rtl:-scale-x-100' />}>
        {t('submitSignIn')}
      </Button>
    </Form>
  )
}
