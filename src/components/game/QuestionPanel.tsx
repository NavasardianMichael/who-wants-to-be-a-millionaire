'use client'

import { motion, useReducedMotion } from 'motion/react'
import { useTranslations } from 'next-intl'
import type { ActiveQuestion } from '@store/game/session/types'
import { cn } from '@helpers/cn'
import { Lozenge } from '@components/ui/bare/Lozenge'

export type QuestionPanelProps = {
  question: ActiveQuestion
  /** e.g. "Question 7 of 15" or "Question 23". */
  counter: string
  className?: string
}

/** The question lozenge. Keyed by question id by the parent, so each new question animates in. */
export const QuestionPanel = ({ question, counter, className }: QuestionPanelProps) => {
  const t = useTranslations('Categories.names')
  const reduce = useReducedMotion()

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, scale: 0.96, filter: 'blur(6px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      // The wire runs to the edges of the board column, not across the ladder beside it.
      className={cn('-mx-4 flex flex-col gap-2 overflow-x-clip px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0', className)}
    >
      <div className='flex items-center justify-center gap-2 text-caption font-bold tracking-[0.18em] text-spot-300 uppercase'>
        <span>{counter}</span>
        <span aria-hidden>·</span>
        <span>{t(question.category)}</span>
      </div>
      <Lozenge tone='gold' wire fillClassName='min-h-24 justify-center px-[calc(var(--spacing-tip)+0.25rem)] py-4 sm:min-h-28'>
        {/* `pretty`, not the headings' `balance`: balanced lines are evened out and so run short, leaving the panel half empty. */}
        <h2
          lang={question.fallback ? 'en' : undefined}
          dir={question.fallback ? 'ltr' : undefined}
          className='w-full text-center font-sans text-question font-semibold text-pretty text-ivory'
        >
          {question.text}
        </h2>
      </Lozenge>
    </motion.div>
  )
}
