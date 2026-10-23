'use client'

import { Check } from 'lucide-react'
import { cn } from '@helpers/cn'

export type ChipProps = {
  label: string
  selected: boolean
  onToggle: () => void
  className?: string
}

/** A toggle button for multi-select lists (categories). */
export const Chip = ({ label, selected, onToggle, className }: ChipProps) => (
  <button
    type='button'
    aria-pressed={selected}
    onClick={onToggle}
    className={cn(
      'inline-flex min-h-10 items-center gap-1.5 rounded-full border px-4 text-body-sm font-semibold transition-colors duration-200',
      selected
        ? 'border-gold-300 bg-gold-400/15 text-gold-200'
        : 'border-spot-300/25 bg-studio-900/60 text-mist hover:border-spot-300/60 hover:text-ivory',
      className
    )}
  >
    {selected && <Check aria-hidden className='size-4' />}
    {label}
  </button>
)
