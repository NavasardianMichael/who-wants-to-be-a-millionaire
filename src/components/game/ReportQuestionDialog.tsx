'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { reportQuestionAPI } from '@api/questions/main'
import { toast } from '@store/toast/store'
import { trackEvent } from '@helpers/analytics'
import { Button } from '@components/ui/Button'
import { Dialog } from '@components/ui/Dialog'
import { ErrorAlert } from '@components/ui/ErrorAlert'

const UUID_PATTERN = /^[0-9a-f-]{36}$/i

/** Only pool questions (UUID ids) can be reported; the bundled offline bank has nothing to retire. */
export const isReportable = (questionId: string): boolean => UUID_PATTERN.test(questionId)

export const ReportQuestionDialog = ({ questionId, open, onClose }: { questionId: string; open: boolean; onClose: () => void }) => {
  const t = useTranslations('Game')
  const [reason, setReason] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<unknown>(null)

  const send = async () => {
    setPending(true)
    setError(null)
    try {
      await reportQuestionAPI({ id: questionId, reason: reason.trim() || undefined })
      trackEvent('question_reported')
      toast(t('reportThanks'), 'success')
      setReason('')
      onClose()
    } catch (caught) {
      setError(caught)
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('reportTitle')}
      footer={
        <Button onClick={send} loading={pending} size='sm'>
          {t('reportSend')}
        </Button>
      }
    >
      <label className='flex flex-col gap-2'>
        <span className='sr-only'>{t('reportPlaceholder')}</span>
        <textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          maxLength={200}
          rows={3}
          placeholder={t('reportPlaceholder')}
          className='w-full rounded-xl border border-spot-300/25 bg-studio-950/70 p-3 text-ivory placeholder:text-mist-dim focus:border-gold-300 focus:outline-none'
        />
      </label>
      {Boolean(error) && <ErrorAlert error={error} className='mt-3' />}
    </Dialog>
  )
}
