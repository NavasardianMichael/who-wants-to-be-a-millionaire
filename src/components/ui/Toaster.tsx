'use client'

import { useEffect } from 'react'
import { CircleAlert, CircleCheck, Info, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useToastStore } from '@store/toast/store'
import type { Toast } from '@store/toast/types'
import { cn } from '@helpers/cn'

const TOAST_MS = 4500

const ToastItem = ({ toast }: { toast: Toast }) => {
  const dismiss = useToastStore.use.dismissToast()
  const t = useTranslations('Common')

  useEffect(() => {
    const timer = setTimeout(() => dismiss(toast.id), TOAST_MS)
    return () => clearTimeout(timer)
  }, [dismiss, toast.id])

  const Icon = toast.tone === 'success' ? CircleCheck : toast.tone === 'error' ? CircleAlert : Info
  return (
    <li
      className={cn(
        'panel pointer-events-auto flex animate-rise items-center gap-3 px-4 py-3 text-body-sm',
        toast.tone === 'success' && 'border-correct-500/50',
        toast.tone === 'error' && 'border-wrong-500/60'
      )}
    >
      <Icon
        aria-hidden
        className={cn(
          'size-5 shrink-0',
          toast.tone === 'success' ? 'text-correct-300' : toast.tone === 'error' ? 'text-wrong-300' : 'text-spot-300'
        )}
      />
      <span className='flex-1'>{toast.message}</span>
      <button type='button' onClick={() => dismiss(toast.id)} aria-label={t('close')} className='text-mist hover:text-ivory'>
        <X aria-hidden className='size-4' />
      </button>
    </li>
  )
}

/** One polite live region for every toast in the app. */
export const Toaster = () => {
  const toasts = useToastStore.use.toasts()
  return (
    <ol
      aria-live='polite'
      className='pointer-events-none fixed inset-x-0 bottom-0 z-50 mx-auto flex w-full max-w-md flex-col gap-2 px-4 pb-[calc(1rem+var(--safe-bottom))]'
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </ol>
  )
}
