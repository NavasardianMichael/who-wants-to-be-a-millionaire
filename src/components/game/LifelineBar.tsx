'use client'

import type { ReactNode } from 'react'
import { Tooltip } from 'antd'
import { Phone, Repeat, Users } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { type Lifeline, LIFELINES } from '@constants/game'
import { cn } from '@helpers/cn'
import { Spinner } from '@components/ui/Spinner'

const ICONS: Record<Lifeline, ReactNode> = {
  fiftyFifty: <span className='font-display text-[0.95rem] font-black tracking-tight'>50:50</span>,
  askAudience: <Users aria-hidden className='size-5 sm:size-6' />,
  phoneAFriend: <Phone aria-hidden className='size-5 sm:size-6' />,
  switchQuestion: <Repeat aria-hidden className='size-5 sm:size-6' />,
}

export type LifelineBarProps = {
  allowed: Lifeline[]
  used: Lifeline[]
  busy: Lifeline | null
  disabled: boolean
  onUse: (lifeline: Lifeline) => void
  className?: string
}

/**
 * The four lifelines as the show's oval tokens. A used one is crossed out with the red X;
 * one the mode doesn't allow is hidden entirely.
 */
export const LifelineBar = ({ allowed, used, busy, disabled, onUse, className }: LifelineBarProps) => {
  const t = useTranslations('Lifelines')
  const visible = LIFELINES.filter((lifeline) => allowed.includes(lifeline))
  if (!visible.length) return null

  return (
    <ul aria-label={t('title')} className={cn('flex items-center justify-center gap-2 sm:gap-3', className)}>
      {visible.map((lifeline) => {
        const isUsed = used.includes(lifeline)
        const isBusy = busy === lifeline
        const name = t(lifeline)
        return (
          <li key={lifeline}>
            <Tooltip
              title={isUsed ? t('used', { name }) : `${name} — ${t(`${lifeline}Description`)}`}
              mouseEnterDelay={0.3}
            >
              <button
                type='button'
                onClick={() => onUse(lifeline)}
                disabled={disabled || isUsed || Boolean(busy)}
                aria-label={isUsed ? t('used', { name }) : name}
                className={cn(
                  'relative flex size-16 items-center justify-center rounded-full border-2 transition-[transform,filter,opacity] duration-200 sm:size-20',
                  'bg-[radial-gradient(ellipse_at_50%_25%,var(--color-studio-400),var(--color-studio-700)_55%,var(--color-studio-900))] text-ivory',
                  isUsed
                    ? 'border-studio-600 opacity-60'
                    : 'border-spot-300 shadow-glow-spot hover:-translate-y-0.5 hover:brightness-125',
                  isBusy && 'border-gold-300 text-gold-200 shadow-glow-gold',
                  disabled && !isUsed && 'opacity-70'
                )}
              >
                {isBusy ? <Spinner size='sm' /> : ICONS[lifeline]}
                {isUsed && (
                  <svg
                    aria-hidden
                    viewBox='0 0 80 80'
                    className='absolute inset-0 size-full'
                    preserveAspectRatio='none'
                  >
                    <line
                      x1='18'
                      y1='18'
                      x2='62'
                      y2='62'
                      stroke='var(--color-wrong-500)'
                      strokeWidth='5'
                      strokeLinecap='round'
                    />
                    <line
                      x1='62'
                      y1='18'
                      x2='18'
                      y2='62'
                      stroke='var(--color-wrong-500)'
                      strokeWidth='5'
                      strokeLinecap='round'
                    />
                  </svg>
                )}
              </button>
            </Tooltip>
          </li>
        )
      })}
    </ul>
  )
}
