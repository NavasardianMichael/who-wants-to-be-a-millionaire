import type { HTMLAttributes } from 'react'
import { cn } from '@helpers/cn'

export type CardProps = HTMLAttributes<HTMLDivElement> & { tone?: 'default' | 'gold'; padded?: boolean }

export const Card = ({ tone = 'default', padded = true, className, ...rest }: CardProps) => (
  <div className={cn(tone === 'gold' ? 'panel-gold' : 'panel', padded && 'p-5 sm:p-6', className)} {...rest} />
)
