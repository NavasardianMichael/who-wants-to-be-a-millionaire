'use client'

import { Check, X } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useTranslations } from 'next-intl'
import { OPTION_LETTERS } from '@constants/game'
import { cn } from '@helpers/cn'
import { Lozenge, type LozengeTone } from '@components/ui/bare/Lozenge'

export type AnswerState = 'idle' | 'selected' | 'locked' | 'correct' | 'wrong' | 'removed' | 'dim'

export type AnswerOptionProps = {
  index: number
  text: string
  state: AnswerState
  disabled: boolean
  onSelect: (index: number) => void
  /** An English fallback question shown in another language's UI: render it left-to-right. */
  foreign?: boolean
}

const TONE: Record<AnswerState, LozengeTone> = {
  idle: 'idle',
  selected: 'selected',
  locked: 'locked',
  correct: 'correct',
  wrong: 'wrong',
  removed: 'dim',
  dim: 'idle',
}

/**
 * One answer lozenge. The state is never carried by colour alone: correct and wrong get an
 * icon, and every state is in the accessible name.
 */
export const AnswerOption = ({ index, text, state, disabled, onSelect, foreign }: AnswerOptionProps) => {
  const t = useTranslations('Game')
  const reduce = useReducedMotion()
  const letter = OPTION_LETTERS[index]!
  const removed = state === 'removed'
  const label = removed ? t('optionRemoved', { letter }) : t('option', { letter, text })
  const onFill = state === 'locked' || state === 'correct' || state === 'wrong'

  return (
    <motion.li
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: removed ? 0.25 : state === 'dim' ? 0.55 : 1, y: 0 }}
      transition={{ delay: reduce ? 0 : 0.08 * index, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className='list-none'
    >
      <button
        type='button'
        disabled={disabled || removed}
        onClick={() => onSelect(index)}
        aria-label={label}
        aria-pressed={state === 'selected' || state === 'locked'}
        dir={foreign ? 'ltr' : undefined}
        className={cn(
          'group block w-full text-start transition-transform duration-200',
          !disabled && !removed && 'hover:-translate-y-0.5 active:scale-[0.985]',
          removed && 'pointer-events-none'
        )}
      >
        <Lozenge
          tone={TONE[state]}
          className={cn(
            state === 'locked' && 'animate-lock-pulse',
            state === 'correct' && 'animate-correct-blink',
            !disabled && !removed && state === 'idle' && 'group-hover:[&_.lozenge]:brightness-125'
          )}
          fillClassName='min-h-14 gap-3 px-[calc(var(--spacing-tip)+0.25rem)] py-2.5 sm:min-h-16'
        >
          <span
            aria-hidden
            className={cn('font-display text-option font-black', onFill ? 'text-studio-950' : 'text-gold-300', removed && 'invisible')}
          >
            {letter}:
          </span>
          <span
            aria-hidden
            lang={foreign ? 'en' : undefined}
            className={cn(
              'flex-1 text-option font-semibold',
              onFill ? 'text-studio-950' : 'text-ivory',
              removed && 'invisible'
            )}
          >
            {text}
          </span>
          {state === 'correct' && <Check aria-hidden className='size-6 shrink-0 text-studio-950' strokeWidth={3} />}
          {state === 'wrong' && <X aria-hidden className='size-6 shrink-0 text-studio-950' strokeWidth={3} />}
        </Lozenge>
      </button>
    </motion.li>
  )
}
