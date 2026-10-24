'use client'

import { useEffect, useState } from 'react'
import { Form, Input } from 'antd'
import { CircleCheck, Send } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { sendContactMessageAPI } from '@api/contact/main'
import { CONTACT_LIMITS } from '@api/contact/types'
import { useAuthStore } from '@store/auth/store'
import { useLeaveGuard } from '@hooks/useLeaveGuard'
import { Button } from '@components/ui/Button'
import { ErrorAlert } from '@components/ui/ErrorAlert'

type Values = { name: string; email: string; message: string; website?: string }

/**
 * Name, email and message (bookie's contact form, trimmed to what a game needs). A signed-in
 * player's name and email are prefilled — only into empty fields, so typing before the
 * session lands is never overwritten. A failed send keeps everything on screen: nothing is
 * stored on the server, so the form is the only copy.
 */
export const ContactForm = () => {
  const t = useTranslations('Contact')
  const locale = useLocale()
  const [form] = Form.useForm<Values>()
  const user = useAuthStore.use.user()
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [isSent, setIsSent] = useState(false)
  const draft = Form.useWatch('message', form)
  useLeaveGuard(!isSent && Boolean(draft?.trim()) && 'unsaved')

  const prefill = () => {
    if (!user) return
    const current = form.getFieldsValue()
    form.setFieldsValue({
      ...(current.name ? {} : { name: user.displayName }),
      ...(current.email || !user.email ? {} : { email: user.email }),
    })
  }

  // Fills blanks only, so it is safe to run whenever the session changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(prefill, [user?.id])

  const send = async (values: Values) => {
    setIsSending(true)
    setError(null)
    try {
      await sendContactMessageAPI({
        name: values.name.trim(),
        email: values.email.trim(),
        message: values.message.trim(),
        locale,
        website: values.website ?? '',
      })
      setIsSent(true)
    } catch (caught) {
      setError(caught)
    } finally {
      setIsSending(false)
    }
  }

  if (isSent) {
    return (
      <div role='status' className='flex flex-col items-center gap-4 py-6 text-center'>
        <CircleCheck aria-hidden className='size-14 text-correct-300' />
        <h2 className='text-h3 font-bold text-gold-200'>{t('sentTitle')}</h2>
        <p className='text-mist'>{t('sentBody')}</p>
        <Button
          variant='outline'
          onClick={() => {
            form.resetFields()
            prefill()
            setIsSent(false)
          }}
        >
          {t('sendAnother')}
        </Button>
      </div>
    )
  }

  return (
    <Form form={form} layout='vertical' requiredMark={false} onFinish={send} scrollToFirstError className='flex flex-col'>
      {Boolean(error) && <ErrorAlert error={error} message={t('error')} className='mb-4' />}

      <div className='grid gap-x-4 sm:grid-cols-2'>
        <Form.Item name='name' label={t('name')} rules={[{ required: true, whitespace: true, message: t('nameRequired') }]}>
          <Input size='large' autoComplete='name' maxLength={CONTACT_LIMITS.name} />
        </Form.Item>
        <Form.Item
          name='email'
          label={t('email')}
          rules={[
            { required: true, message: t('emailRequired') },
            { type: 'email', message: t('emailInvalid') },
          ]}
        >
          <Input size='large' type='email' inputMode='email' autoComplete='email' />
        </Form.Item>
      </div>

      <Form.Item name='message' label={t('message')} rules={[{ required: true, whitespace: true, message: t('messageRequired') }]}>
        <Input.TextArea
          autoSize={{ minRows: 5, maxRows: 12 }}
          maxLength={CONTACT_LIMITS.message}
          showCount
          placeholder={t('messagePlaceholder')}
        />
      </Form.Item>

      {/* Honeypot: hidden from people and assistive tech, filled in by bots, dropped by the server. */}
      <div className='hidden' aria-hidden='true'>
        <Form.Item name='website' noStyle>
          <input type='text' tabIndex={-1} autoComplete='off' />
        </Form.Item>
      </div>

      {/* `self-end` follows `dir`, so the button sits on the trailing edge in RTL too. */}
      <Button type='submit' loading={isSending} icon={<Send aria-hidden className='size-5 rtl:-scale-x-100' />} className='mt-2 self-end'>
        {t('send')}
      </Button>
    </Form>
  )
}
