'use client'

import { useState } from 'react'
import { Form, Input } from 'antd'
import { UserPlus } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useAuthStore } from '@store/auth/store'
import { DISPLAY_NAME_LIMITS, PASSWORD_LIMITS } from '@constants/auth'
import { ROUTES } from '@constants/routes'
import { AppLink } from '@components/ui/bare/AppLink'
import { Button } from '@components/ui/Button'
import { ErrorAlert } from '@components/ui/ErrorAlert'
import { confirmPasswordRules, passwordRules, useAuthErrorMessage } from './authForm'
import { AuthGate } from './AuthGate'
import { GoogleOption } from './GoogleOption'
import { VerificationNotice } from './VerificationNotice'

type Values = { displayName: string; email: string; password: string; confirmPassword: string }

const linkClass = 'font-semibold text-gold-200 underline-offset-4 hover:underline'

/**
 * A password sign-up creates the account inactive: no session until the emailed link is
 * opened, so the form gives way to "check your inbox". The email goes out in this page's
 * language, which also becomes the account's.
 */
export const SignUpView = () => {
  const t = useTranslations('Auth')
  const locale = useLocale()
  const register = useAuthStore.use.register()
  const errorMessage = useAuthErrorMessage()
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<unknown>(null)
  /** Where the verification link went; set once the account exists. */
  const [sentTo, setSentTo] = useState<string | null>(null)

  const onFinish = async ({ displayName, email, password }: Values) => {
    setError(null)
    setIsSending(true)
    try {
      const result = await register({ displayName: displayName.trim(), email: email.trim(), password, locale })
      setSentTo(result.email)
    } catch (failure) {
      setError(failure)
    } finally {
      setIsSending(false)
    }
  }

  const signInLink = (
    <p className='text-center text-body-sm text-mist'>
      {t('haveAccount')}{' '}
      <AppLink href={ROUTES.signIn} className={linkClass}>
        {t('signInTitle')}
      </AppLink>
    </p>
  )

  if (sentTo) {
    return (
      <div className='flex flex-col gap-5'>
        <VerificationNotice variant='sent' email={sentTo} />
        {signInLink}
      </div>
    )
  }

  return (
    <AuthGate>
      <div className='flex flex-col gap-6'>
        <GoogleOption />
        <Form<Values>
          layout='vertical'
          requiredMark={false}
          onFinish={onFinish}
          disabled={isSending}
          scrollToFirstError
          className='flex flex-col [&_.ant-form-item-label>label]:font-semibold'
        >
          <Form.Item
            name='displayName'
            label={t('displayName')}
            extra={t('displayNameHint', DISPLAY_NAME_LIMITS)}
            rules={[
              { required: true, whitespace: true, message: t('required') },
              {
                validator: (_rule, value: string | undefined) => {
                  const length = value?.trim().length ?? 0
                  return !value || (length >= DISPLAY_NAME_LIMITS.min && length <= DISPLAY_NAME_LIMITS.max)
                    ? Promise.resolve()
                    : Promise.reject(new Error(t('invalidDisplayName', DISPLAY_NAME_LIMITS)))
                },
              },
            ]}
          >
            <Input size='large' autoComplete='nickname' maxLength={DISPLAY_NAME_LIMITS.max} />
          </Form.Item>
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
          <Form.Item
            name='password'
            label={t('password')}
            extra={t('passwordHint', { min: PASSWORD_LIMITS.min })}
            rules={passwordRules(t('required'), t('weakPassword', { min: PASSWORD_LIMITS.min }))}
          >
            <Input.Password size='large' autoComplete='new-password' maxLength={PASSWORD_LIMITS.max} />
          </Form.Item>
          <Form.Item
            name='confirmPassword'
            label={t('confirmPassword')}
            dependencies={['password']}
            rules={confirmPasswordRules('password', t('required'), t('passwordMismatch'))}
          >
            <Input.Password size='large' autoComplete='new-password' maxLength={PASSWORD_LIMITS.max} />
          </Form.Item>

          {Boolean(error) && <ErrorAlert error={error} message={errorMessage(error)} className='mb-4' />}

          <Button type='submit' fullWidth loading={isSending} icon={<UserPlus aria-hidden className='size-5' />}>
            {t('submitSignUp')}
          </Button>
          <p className='mt-4 text-center text-caption text-mist'>
            {t.rich('terms', {
              terms: (chunks) => (
                <AppLink href={ROUTES.terms} className={linkClass}>
                  {chunks}
                </AppLink>
              ),
              privacy: (chunks) => (
                <AppLink href={ROUTES.privacy} className={linkClass}>
                  {chunks}
                </AppLink>
              ),
            })}
          </p>
        </Form>
        {signInLink}
      </div>
    </AuthGate>
  )
}
