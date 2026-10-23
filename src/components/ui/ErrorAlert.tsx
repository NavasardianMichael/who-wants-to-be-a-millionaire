'use client'

import { CircleAlert, RotateCcw } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@helpers/cn'
import { classifyError, IS_DEV } from '@helpers/error'
import { Button } from './Button'

export type ErrorAlertProps = {
  error: unknown
  /** Overrides the kind-based copy with a context-specific sentence. */
  message?: string
  onRetry?: () => void
  className?: string
}

/**
 * The one inline error block: translated copy chosen by error *kind* in production, the
 * original message added underneath in development. Never renders a server's own text.
 */
export const ErrorAlert = ({ error, message, onRetry, className }: ErrorAlertProps) => {
  const t = useTranslations()
  const { kind, details } = classifyError(error)

  return (
    <div role='alert' className={cn('panel flex flex-col gap-3 border-wrong-500/50 p-4', className)}>
      <div className='flex items-start gap-3'>
        <CircleAlert aria-hidden className='mt-0.5 size-5 shrink-0 text-wrong-300' />
        <p className='flex-1 text-body-sm text-ivory'>{message ?? t(`Errors.${kind}`)}</p>
      </div>
      {IS_DEV && (
        <details className='text-caption text-mist-dim'>
          <summary className='cursor-pointer'>{t('Errors.details')}</summary>
          <code className='mt-1 block break-all'>{details}</code>
        </details>
      )}
      {onRetry && (
        <Button variant='outline' size='sm' onClick={onRetry} icon={<RotateCcw className='size-4' />} className='self-start'>
          {t('Common.retry')}
        </Button>
      )}
    </div>
  )
}
