'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@helpers/cn'

export type TimerRingProps = {
  /** Milliseconds left, or null for no limit. */
  remainingMs: number | null
  totalMs: number | null
  size?: 'md' | 'lg'
  className?: string
}

const RADIUS = 44
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

/**
 * The countdown ring. Calm blue, then amber under 10 s, then a red pulse under 5 s. A screen
 * reader hears the time only at those two thresholds — announcing every second would drown
 * out the question.
 */
export const TimerRing = ({ remainingMs, totalMs, size = 'md', className }: TimerRingProps) => {
  const t = useTranslations('Game')
  const seconds = remainingMs === null ? null : Math.ceil(remainingMs / 1000)
  const [announcement, setAnnouncement] = useState('')
  const lastAnnounced = useRef<number | null>(null)

  useEffect(() => {
    if (seconds === null || (seconds !== 10 && seconds !== 5) || lastAnnounced.current === seconds) return
    lastAnnounced.current = seconds
    setAnnouncement(t('secondsLeft', { count: seconds }))
  }, [seconds, t])

  const progress = remainingMs === null || !totalMs ? 1 : Math.max(0, Math.min(1, remainingMs / totalMs))
  const tone = seconds === null ? 'calm' : seconds <= 5 ? 'danger' : seconds <= 10 ? 'warn' : 'calm'

  return (
    <div
      className={cn('relative shrink-0', size === 'md' ? 'size-16 sm:size-20' : 'size-24 sm:size-28', tone === 'danger' && 'animate-lock-pulse', className)}
    >
      <svg viewBox='0 0 100 100' className='size-full -rotate-90' aria-hidden>
        <circle cx='50' cy='50' r={RADIUS} fill='var(--color-studio-950)' stroke='var(--color-studio-700)' strokeWidth='7' />
        <circle
          cx='50'
          cy='50'
          r={RADIUS}
          fill='none'
          strokeWidth='7'
          strokeLinecap='round'
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
          className={cn(
            'transition-[stroke-dashoffset,stroke] duration-200 ease-linear',
            tone === 'calm' && 'stroke-spot-500',
            tone === 'warn' && 'stroke-lock-500',
            tone === 'danger' && 'stroke-wrong-500'
          )}
        />
      </svg>
      <span
        className={cn(
          'absolute inset-0 flex items-center justify-center font-display font-black tabular',
          size === 'md' ? 'text-h3' : 'text-h2',
          tone === 'danger' ? 'text-wrong-300' : tone === 'warn' ? 'text-lock-300' : 'text-ivory'
        )}
      >
        {seconds === null ? '∞' : seconds}
      </span>
      <span className='sr-only'>{seconds === null ? t('noTimeLimit') : t('timeLeft')}</span>
      <span aria-live='assertive' className='sr-only'>
        {announcement}
      </span>
    </div>
  )
}
