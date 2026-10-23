'use client'

import { useId } from 'react'
import { cn } from '@helpers/cn'

export type ToggleProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description?: string
  disabled?: boolean
  className?: string
}

/** A switch (`role="switch"`) with its label clickable as one row. */
export const Toggle = ({ checked, onChange, label, description, disabled, className }: ToggleProps) => {
  const id = useId()
  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      <label htmlFor={id} className='min-w-0 flex-1 cursor-pointer'>
        <span className='block font-semibold text-ivory'>{label}</span>
        {description && <span className='block text-body-sm text-mist'>{description}</span>}
      </label>
      <button
        id={id}
        type='button'
        role='switch'
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-7 w-12 shrink-0 rounded-full border transition-colors duration-200 disabled:opacity-50',
          checked ? 'border-gold-300 bg-gold-400' : 'border-spot-300/30 bg-studio-800'
        )}
      >
        <span
          aria-hidden
          className={cn(
            'absolute top-0.5 size-5.5 rounded-full shadow transition-all duration-200',
            checked ? 'inset-s-[calc(100%-1.5rem)] bg-studio-950' : 'inset-s-0.5 bg-mist'
          )}
        />
      </button>
    </div>
  )
}
