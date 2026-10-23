import { Gem } from 'lucide-react'
import { LADDER, SAFE_HAVEN_STAGES } from '@constants/game'
import { cn } from '@helpers/cn'
import { formatMoney } from '@helpers/money'

export type PrizeLadderProps = {
  locale: string
  /** The stage being played (1-15); 0 for a static, informational ladder. */
  currentStage: number
  /** Questions already answered correctly. */
  answered: number
  title: string
  safeHavenLabel: string
  className?: string
  compact?: boolean
}

/**
 * The money ladder, top prize first, as on the show. Renders on the server for the home and
 * rules pages and in the game itself. Passed rungs get a gold diamond, the current rung
 * glows, safe havens are drawn in gold.
 */
export const PrizeLadder = ({ locale, currentStage, answered, title, safeHavenLabel, className, compact }: PrizeLadderProps) => {
  const rungs = LADDER.map((amount, index) => ({ stage: index + 1, amount })).reverse()

  return (
    <section aria-label={title} className={cn('panel overflow-hidden p-2', className)}>
      <ol className='flex flex-col gap-0.5'>
        {rungs.map(({ stage, amount }) => {
          const isCurrent = stage === currentStage
          const isPassed = stage <= answered
          const isHaven = (SAFE_HAVEN_STAGES as readonly number[]).includes(stage)
          const isTop = stage === LADDER.length

          return (
            <li
              key={stage}
              aria-current={isCurrent ? 'step' : undefined}
              className={cn(
                'relative flex items-center gap-3 rounded-lg px-3 font-display tabular transition-colors duration-500',
                compact ? 'min-h-7 text-body-sm' : 'min-h-8 text-body-sm xl:text-body',
                isCurrent && 'bg-[linear-gradient(90deg,var(--color-lock-500),var(--color-lock-700))] text-studio-950 shadow-glow-lock',
                !isCurrent && isHaven && 'text-ivory',
                !isCurrent && !isHaven && (isPassed ? 'text-gold-300' : 'text-lock-300/90'),
                !isCurrent && isTop && 'text-gold-200'
              )}
            >
              {isCurrent && <span aria-hidden className='absolute inset-0 rounded-lg sweep-gold' />}
              <span className={cn('w-6 text-end font-bold', isCurrent ? 'text-studio-950' : 'text-mist-dim')}>{stage}</span>
              <span aria-hidden className='w-4'>
                {isPassed && !isCurrent && <Gem className='size-3.5 text-gold-300' />}
              </span>
              <span className={cn('flex-1 font-bold', isHaven && !isCurrent && 'text-gold-gradient')}>
                {formatMoney(amount, locale)}
              </span>
              {isHaven && <span className='sr-only'>{safeHavenLabel}</span>}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
