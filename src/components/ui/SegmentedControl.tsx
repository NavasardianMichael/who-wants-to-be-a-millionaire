'use client'

import { type KeyboardEvent, useRef } from 'react'
import { cn } from '@helpers/cn'

export type SegmentedOption<T extends string | number> = { value: T; label: string }

export type SegmentedControlProps<T extends string | number> = {
  label: string
  value: T
  options: SegmentedOption<T>[]
  onChange: (value: T) => void
  className?: string
  size?: 'sm' | 'md'
}

/**
 * A radio group drawn as pills. Arrow keys move the selection, as a native radio group does,
 * and only the selected pill is in the tab order.
 */
export const SegmentedControl = <T extends string | number>({
  label,
  value,
  options,
  onChange,
  className,
  size = 'md',
}: SegmentedControlProps<T>) => {
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  const onKeyDown = (event: KeyboardEvent, index: number) => {
    const forward = event.key === 'ArrowRight' || event.key === 'ArrowDown'
    const backward = event.key === 'ArrowLeft' || event.key === 'ArrowUp'
    if (!forward && !backward) return
    event.preventDefault()
    // Visual order flips in RTL, so follow the DOM's own direction.
    const rtl = getComputedStyle(event.currentTarget).direction === 'rtl'
    const step = (forward ? 1 : -1) * (rtl && (event.key === 'ArrowRight' || event.key === 'ArrowLeft') ? -1 : 1)
    const next = (index + step + options.length) % options.length
    onChange(options[next]!.value)
    refs.current[next]?.focus()
  }

  return (
    <div
      role='radiogroup'
      aria-label={label}
      className={cn('inline-flex flex-wrap gap-1 rounded-full border border-spot-300/20 bg-studio-950/60 p-1', className)}
    >
      {options.map((option, index) => {
        const selected = option.value === value
        return (
          <button
            key={String(option.value)}
            ref={(element) => {
              refs.current[index] = element
            }}
            type='button'
            role='radio'
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cn(
              'rounded-full font-semibold transition-colors duration-200',
              size === 'md' ? 'min-h-10 px-4 text-body-sm' : 'min-h-8 px-3 text-caption',
              selected ? 'bg-gold-400 text-studio-950 shadow-glow-gold' : 'text-mist hover:bg-white/5 hover:text-ivory'
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
