'use client'

import type { ReactNode } from 'react'
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
            <button
              type='button'
              onClick={() => onUse(lifeline)}
              disabled={disabled || isUsed || Boolean(busy)}
              aria-label={isUsed ? t('used', { name }) : name}
              title={isUsed ? t('used', { name }) : `${name} — ${t(`${lifeline}Description`)}`}
              className={cn(
                'relative flex h-12 w-[4.5rem] items-center justify-center rounded-[50%] border-2 transition-[transform,filter,opacity] duration-200 sm:h-14 sm:w-20',
                'bg-[radial-gradient(ellipse_at_50%_30%,var(--color-studio-600),var(--color-studio-900))] text-ivory',
                isUsed ? 'border-studio-600 opacity-60' : 'border-spot-300/70 shadow-glow-spot hover:-translate-y-0.5 hover:brightness-125',
                isBusy && 'border-gold-300 text-gold-200 shadow-glow-gold',
                disabled && !isUsed && 'opacity-70'
              )}
            >
              {isBusy ? <Spinner size='sm' /> : ICONS[lifeline]}
              {isUsed && (
                <svg aria-hidden viewBox='0 0 80 56' className='absolute inset-0 size-full' preserveAspectRatio='none'>
                  <line x1='14' y1='8' x2='66' y2='48' stroke='var(--color-wrong-500)' strokeWidth='5' strokeLinecap='round' />
                  <line x1='66' y1='8' x2='14' y2='48' stroke='var(--color-wrong-500)' strokeWidth='5' strokeLinecap='round' />
                </svg>
              )}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
