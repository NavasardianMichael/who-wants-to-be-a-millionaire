import { OPTION_LETTERS } from '@constants/game'
import { cn } from '@helpers/cn'
import { Emblem } from '@components/brand/Emblem'
import { Lozenge } from '@components/ui/bare/Lozenge'

/** Each panel lights this long after the one before it; the cycle is `--animate-light-up`'s 1.6 s. */
const STAGGER_MS = 200

/**
 * The wait before a question, staged like the show: the emblem under a turning spotlight,
 * and the four answer panels lighting up one after another as the studio comes on. The
 * label is the live status; the visuals are decorative and freeze under reduced motion.
 */
export const StudioLoader = ({ label, className }: { label: string; className?: string }) => (
  <div role='status' className={cn('flex w-full max-w-md flex-col items-center gap-5', className)}>
    <div aria-hidden className='relative flex size-36 items-center justify-center'>
      <span className='absolute inset-0 animate-spin-fast rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,var(--color-gold-300)_40deg,transparent_80deg,transparent_180deg,var(--color-magenta-400)_220deg,transparent_260deg)] opacity-60 blur-md' />
      <span className='absolute inset-3 rounded-full bg-studio-950/80' />
      <Emblem className='relative size-24 animate-float drop-shadow-[0_0_24px_var(--color-gold-500)]' />
    </div>

    <ol aria-hidden className='grid w-full grid-cols-2 gap-x-4 gap-y-2'>
      {OPTION_LETTERS.map((letter, index) => (
        <li key={letter} className='relative h-9'>
          <Lozenge className='absolute inset-0' fillClassName='px-5'>
            <span className='font-display text-caption font-black text-gold-300'>{letter}:</span>
          </Lozenge>
          <Lozenge
            tone='locked'
            className='absolute inset-0 animate-light-up opacity-0'
            fillClassName='px-5'
            style={{ animationDelay: `${index * STAGGER_MS}ms` }}
          >
            <span className='font-display text-caption font-black text-studio-950'>{letter}:</span>
          </Lozenge>
        </li>
      ))}
    </ol>

    <p className='text-center font-display text-body font-bold text-shimmer'>{label}</p>
  </div>
)
