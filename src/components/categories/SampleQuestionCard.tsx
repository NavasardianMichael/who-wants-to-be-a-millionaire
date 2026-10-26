import { ChevronDown } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import type { SampleQuestion } from '@api/questions/types'
import { OPTION_LETTERS } from '@constants/game'

/**
 * A sample question with its answer behind a native `<details>` — no JavaScript, and the
 * answer is in the HTML for crawlers ("questions and answers" is what people search for).
 */
export const SampleQuestionCard = async ({ number, question }: { number: number; question: SampleQuestion }) => {
  const t = await getTranslations('Categories')
  const answer = `${OPTION_LETTERS[question.correctIndex]}: ${question.options[question.correctIndex]}`

  return (
    <li className='panel flex flex-col gap-4 p-5'>
      <h3 className='flex gap-3 font-semibold text-ivory'>
        <span className='font-display font-black text-gold-300'>{number}.</span>
        <span>{question.text}</span>
      </h3>
      <ul className='grid gap-2 sm:grid-cols-2'>
        {question.options.map((option, index) => (
          <li key={option} className='rounded-xl border border-spot-300/20 bg-studio-950/50 px-3 py-2 text-body-sm'>
            <span className='me-1.5 font-display font-black text-gold-300'>{OPTION_LETTERS[index]}:</span>
            {option}
          </li>
        ))}
      </ul>
      <details className='group'>
        <summary className='inline-flex cursor-pointer list-none items-center gap-1.5 text-body-sm font-semibold text-spot-300 [&::-webkit-details-marker]:hidden'>
          {t('revealAnswer')}
          <ChevronDown aria-hidden className='size-4 transition-transform group-open:rotate-180' />
        </summary>
        <div className='mt-3 rounded-xl border border-correct-500/40 bg-correct-500/10 p-3 text-body-sm'>
          <p className='font-bold text-correct-300'>{t('answer', { answer })}</p>
          {question.explanation && <p className='mt-1 text-mist'>{question.explanation}</p>}
        </div>
      </details>
    </li>
  )
}
