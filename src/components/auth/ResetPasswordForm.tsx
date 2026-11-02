'use client'

import { useState } from 'react'
import { Alert, Form, Input } from 'antd'
import { KeyRound } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { resetPasswordAPI } from '@api/identity/main'
import { useAuthStore } from '@store/auth/store'
import { toast } from '@store/toast/store'
import { useRouter } from '@i18n/navigation'
import { PASSWORD_LIMITS, TOKEN_QUERY } from '@constants/auth'
import { ROUTES } from '@constants/routes'
import { ButtonLink } from '@components/ui/bare/AppLink'
import { Button } from '@components/ui/Button'
import { ErrorAlert } from '@components/ui/ErrorAlert'
import { Spinner } from '@components/ui/Spinner'
import { authErrorKey, confirmPasswordRules, passwordRules, useAuthErrorMessage, useQueryParam } from './authForm'

type Values = { password: string; confirmPassword: string }

/**
 * Where the emailed reset link lands. Saving signs this browser in (the API ends every other
 * session) and moves on to the profile. An expired or spent link offers a fresh one.
 */
export const ResetPasswordForm = () => {
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()
  const setUser = useAuthStore.use.setUser()
  const errorMessage = useAuthErrorMessage()
  /** The emailed link's token. Not named `token`: the timing-attack lint reads `=== undefined` on it as a secret compare. */
  const linkCode = useQueryParam(TOKEN_QUERY)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<unknown>(null)

  if (linkCode === undefined) {
    return (
      <div className='flex justify-center py-10'>
        <Spinner size='lg' label={t('Common.loading')} />
      </div>
    )
  }

  const newLink = (
    <ButtonLink href={ROUTES.forgotPassword} variant='outline' fullWidth>
      {t('Auth.requestNewLink')}
    </ButtonLink>
  )

  if (!linkCode) {
    return (
      <div className='flex flex-col gap-5'>
        <Alert type='warning' showIcon title={t('Auth.resetMissing')} />
        {newLink}
      </div>
    )
  }

  const onFinish = async ({ password }: Values) => {
    setError(null)
    setIsSending(true)
    try {
      setUser(await resetPasswordAPI({ token: linkCode, password, locale }))
      toast(t('Auth.passwordSaved'), 'success')
      router.replace(ROUTES.profile)
    } catch (failure) {
      setError(failure)
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
        name='password'
        label={t('Auth.newPassword')}
        extra={t('Auth.passwordHint', { min: PASSWORD_LIMITS.min })}
        rules={passwordRules(t('Auth.required'), t('Auth.weakPassword', { min: PASSWORD_LIMITS.min }))}
      >
        <Input.Password size='large' autoComplete='new-password' maxLength={PASSWORD_LIMITS.max} />
      </Form.Item>
      <Form.Item
        name='confirmPassword'
        label={t('Auth.confirmPassword')}
        dependencies={['password']}
        rules={confirmPasswordRules('password', t('Auth.required'), t('Auth.passwordMismatch'))}
      >
        <Input.Password size='large' autoComplete='new-password' maxLength={PASSWORD_LIMITS.max} />
      </Form.Item>
      {Boolean(error) && <ErrorAlert error={error} message={errorMessage(error)} className='mb-4' />}
      {authErrorKey(error) === 'resetTokenInvalid' ? (
        newLink
      ) : (
        <Button type='submit' fullWidth loading={isSending} icon={<KeyRound aria-hidden className='size-5' />}>
          {t('Auth.resetSubmit')}
        </Button>
      )}
    </Form>
  )
}
