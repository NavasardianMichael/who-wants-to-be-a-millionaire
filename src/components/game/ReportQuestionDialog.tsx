'use client'

import { useState } from 'react'
import { Input } from 'antd'
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
      pending={pending}
      title={t('reportTitle')}
      footer={
        <Button onClick={send} loading={pending} size='sm'>
          {t('reportSend')}
        </Button>
      }
    >
      <Input.TextArea
        aria-label={t('reportPlaceholder')}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        maxLength={200}
        showCount
        autoSize={{ minRows: 3, maxRows: 6 }}
        placeholder={t('reportPlaceholder')}
      />
      {Boolean(error) && <ErrorAlert error={error} className='mt-6' />}
    </Dialog>
  )
}
