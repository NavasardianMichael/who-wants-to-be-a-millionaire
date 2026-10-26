'use client'

import { motion, useReducedMotion } from 'motion/react'
import { useTranslations } from 'next-intl'
import { OPTION_LETTERS } from '@constants/game'
import { cn } from '@helpers/cn'

/**
 * The audience's vote as the show draws it: four bars rising from the floor. The full result
 * is also one sentence for screen readers, since a bar chart has no other text alternative.
 */
export const AudiencePanel = ({ votes, removed }: { votes: number[]; removed: number[] }) => {
  const t = useTranslations('Lifelines')
  const reduce = useReducedMotion()
  const max = Math.max(...votes, 1)
  const summary = votes.map((vote, index) => `${OPTION_LETTERS[index]} ${vote}%`).join(', ')

  return (
    <figure className='flex flex-col items-center gap-3'>
      <figcaption className='font-display text-body-sm font-bold tracking-widest text-gold-200 uppercase'>{t('audienceTitle')}</figcaption>
      <p className='sr-only'>{t('audienceChart', { results: summary })}</p>
      <div aria-hidden className='flex h-36 items-end gap-3 sm:h-44 sm:gap-5'>
        {votes.map((vote, index) => (
          <div key={OPTION_LETTERS[index]} className='flex w-11 flex-col items-center gap-1.5 sm:w-14'>
            <span className={cn('font-display text-body-sm font-black tabular', removed.includes(index) ? 'text-mist-dim' : 'text-ivory')}>
              {vote}%
            </span>
            <div className='relative flex h-24 w-full items-end overflow-hidden rounded-t-md bg-studio-950/70 sm:h-32'>
              <motion.div
                initial={reduce ? false : { height: 0 }}
                animate={{ height: `${(vote / max) * 100}%` }}
                transition={{ type: 'spring', stiffness: 90, damping: 16, delay: reduce ? 0 : 0.1 * index }}
                className='w-full rounded-t-md bg-[linear-gradient(180deg,var(--color-spot-300),var(--color-spot-600))] shadow-glow-spot'
              />
            </div>
            <span className='font-display font-black text-gold-300'>{OPTION_LETTERS[index]}</span>
          </div>
        ))}
      </div>
    </figure>
  )
}
