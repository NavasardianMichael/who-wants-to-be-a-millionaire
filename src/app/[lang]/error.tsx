'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { reportError } from '@helpers/reportError'
import { reloadIfStaleBuild } from '@helpers/staleBuild'
import { ErrorAlert } from '@components/ui/ErrorAlert'

export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations('Errors')

  useEffect(() => {
    // "Try again" can't fix a stale build: `reset` re-renders with the same broken modules.
    if (reloadIfStaleBuild(error)) return
    reportError(error, 'route')
  }, [error])

  return (
    <div className='container-page flex min-h-[50dvh] flex-col items-center justify-center gap-4 py-16 text-center'>
      <h1 className='text-h2 font-bold text-gold-gradient'>{t('pageErrorTitle')}</h1>
      <p className='max-w-md text-mist'>{t('pageErrorBody')}</p>
      <ErrorAlert error={error} onRetry={reset} className='w-full max-w-md text-start' />
    </div>
  )
}
