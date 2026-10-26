'use client'

import { Tag } from 'antd'
import { Check } from 'lucide-react'
import { cn } from '@helpers/cn'

export type ChipProps = {
  label: string
  selected: boolean
  onToggle: () => void
  className?: string
}

/** antd's `CheckableTag` for multi-select lists (categories), sized for touch. */
export const Chip = ({ label, selected, onToggle, className }: ChipProps) => (
  <Tag.CheckableTag
    checked={selected}
    onChange={onToggle}
    // Through `icon`, not children: the tag wraps children in a span, where the block-level SVG would wrap.
    icon={selected ? <Check aria-hidden className='size-4 shrink-0' /> : undefined}
    className={cn(
      'm-0 inline-flex min-h-10 items-center gap-1.5 border px-3.5 text-body-sm font-semibold whitespace-nowrap',
      selected ? 'border-gold-300 bg-gold-400/15 text-gold-200' : 'border-line-strong bg-studio-900/60 text-mist hover:text-ivory',
      className
    )}
  >
    {label}
  </Tag.CheckableTag>
)
