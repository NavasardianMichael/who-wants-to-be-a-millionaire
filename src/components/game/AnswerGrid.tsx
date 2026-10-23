'use client'

import type { GamePhase } from '@store/game/session/types'
import type { ActiveQuestion } from '@store/game/session/types'
import { AnswerOption, type AnswerState } from './AnswerOption'

export type AnswerGridProps = {
  question: ActiveQuestion
  phase: GamePhase
  selectedIndex: number | null
  revealedCorrectIndex: number | null
  onSelect: (index: number) => void
}

const stateFor = (
  index: number,
  { question, phase, selectedIndex, revealedCorrectIndex }: Omit<AnswerGridProps, 'onSelect'>
): AnswerState => {
  if (question.removed.includes(index)) return 'removed'
  if (phase === 'revealed' || phase === 'transition' || phase === 'ended') {
    if (index === revealedCorrectIndex) return 'correct'
    if (index === selectedIndex) return 'wrong'
    return 'dim'
  }
  if (index === selectedIndex) return phase === 'locked' ? 'locked' : 'selected'
  if (phase === 'locked') return 'dim'
  return 'idle'
}

/** 1 column on phones (thumb reach), the show's 2 × 2 from `sm` up. */
export const AnswerGrid = (props: AnswerGridProps) => {
  const { question, phase, onSelect } = props
  const interactive = phase === 'asking' || phase === 'selected'

  return (
    <ol className='grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-3'>
      {question.options.map((text, index) => (
        <AnswerOption
          key={`${question.id}-${index}`}
          index={index}
          text={text}
          state={stateFor(index, props)}
          disabled={!interactive}
          onSelect={onSelect}
          foreign={question.fallback}
        />
      ))}
    </ol>
  )
}
