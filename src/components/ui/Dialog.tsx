'use client'

import { type ReactNode, useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@helpers/cn'
import { IconButton } from './IconButton'

/**
 * Native `<dialog>` with `showModal()`: focus trapping, Escape, inert background and the
 * top layer come from the browser. `variant='sheet'` docks to the bottom on phones (and stays
 * centred from `sm` up); `variant='drawer'` slides in from the inline end.
 */
export type DialogProps = {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  variant?: 'center' | 'sheet' | 'drawer'
  /** Hide the visual title (it still names the dialog for screen readers). */
  hideTitle?: boolean
  className?: string
  closeOnBackdrop?: boolean
}

export const Dialog = ({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  variant = 'center',
  hideTitle,
  className,
  closeOnBackdrop = true,
}: DialogProps) => {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descriptionId = useId()
  const t = useTranslations('Common')

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    // The click handler only closes on a backdrop click; keyboard users close with Escape,
    // which the native <dialog> handles through `onCancel` below.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        // A click on the dialog element itself (not its content) is a click on the backdrop.
        if (closeOnBackdrop && event.target === event.currentTarget) onClose()
      }}
      className={cn(
        'm-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-visible bg-transparent p-0 text-ivory',
        'backdrop:bg-studio-950/80',
        open && 'animate-pop',
        variant === 'center' && 'max-w-lg',
        variant === 'sheet' &&
          'mb-0 w-full max-w-none sm:mb-auto sm:w-[calc(100%-2rem)] sm:max-w-lg',
        variant === 'drawer' && 'me-0 ms-auto my-0 h-dvh max-h-dvh w-[min(24rem,100%)] max-w-none',
        className
      )}
    >
      <div
        className={cn(
          'panel flex max-h-[inherit] flex-col overflow-hidden',
          variant === 'sheet' && 'rounded-b-none pb-safe sm:rounded-b-panel sm:pb-0',
          variant === 'drawer' && 'h-full rounded-e-none pt-safe pb-safe'
        )}
      >
        <header className={cn('flex items-start gap-3 px-5 pt-5 sm:px-6', hideTitle && 'sr-only')}>
          <div className='min-w-0 flex-1'>
            <h2 id={titleId} className='font-display text-h3 font-bold text-gold-200'>
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className='mt-1 text-body-sm text-mist'>
                {description}
              </p>
            )}
          </div>
          <IconButton label={t('close')} icon={<X className='size-5' />} onClick={onClose} className='-me-2 -mt-1' />
        </header>
        {hideTitle && (
          <IconButton label={t('close')} icon={<X className='size-5' />} onClick={onClose} className='absolute inset-e-3 top-3 z-10' />
        )}
        {children && <div className='min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6'>{children}</div>}
        {footer && <footer className='flex flex-wrap justify-end gap-3 border-t border-spot-300/10 px-5 py-4 sm:px-6'>{footer}</footer>}
      </div>
    </dialog>
  )
}
