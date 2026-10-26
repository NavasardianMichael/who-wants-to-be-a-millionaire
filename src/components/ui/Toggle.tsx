'use client'

import { useId } from 'react'
import { Switch } from 'antd'
import { cn } from '@helpers/cn'

export type ToggleProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description?: string
  disabled?: boolean
  className?: string
}

/** A labelled row around antd's `Switch` (`role="switch"`); the label toggles it too. */
export const Toggle = ({ checked, onChange, label, description, disabled, className }: ToggleProps) => {
  const id = useId()
  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      <label htmlFor={id} className='min-w-0 flex-1 cursor-pointer'>
        <span className='block font-semibold text-ivory'>{label}</span>
        {description && <span className='block text-body-sm text-mist'>{description}</span>}
      </label>
      <Switch id={id} checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  )
}
