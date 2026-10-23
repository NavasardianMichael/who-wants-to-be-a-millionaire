import { OPTION_LETTERS } from '@constants/game'
import { Emblem } from '@components/brand/Emblem'
import { Lozenge, type LozengeTone } from '@components/ui/bare/Lozenge'

/**
 * A decorative still of the studio for the hero: the emblem under the lights, a question
 * and four answers, one of them locked in. `aria-hidden` — it illustrates, it isn't content.
 */
export const StudioPreview = ({ question, options }: { question: string; options: string[] }) => {
  const tones: LozengeTone[] = ['idle', 'locked', 'idle', 'idle']
  return (
    <div aria-hidden className='relative flex flex-col items-center gap-5 select-none'>
      <div className='absolute top-6 left-1/2 size-72 -translate-x-1/2 rounded-full bg-spot-500/25 blur-3xl' />
      <div className='relative'>
        <span className='absolute inset-0 animate-spin-slow rounded-full bg-[conic-gradient(from_0deg,transparent,var(--color-gold-300),transparent_30%)] opacity-40 blur-md' />
        <Emblem className='relative size-40 animate-float drop-shadow-[0_0_40px_var(--color-gold-500)] sm:size-52' />
      </div>
      <div className='w-full max-w-lg'>
        <Lozenge tone='gold' fillClassName='min-h-20 justify-center px-8 py-3'>
          <p className='text-center text-body font-semibold text-ivory sm:text-h3'>{question}</p>
        </Lozenge>
      </div>
      <ul className='grid w-full max-w-lg grid-cols-2 gap-x-4 gap-y-2.5'>
        {options.map((option, index) => (
          <li key={option}>
            <Lozenge tone={tones[index]} className={index === 1 ? 'animate-lock-pulse' : undefined} fillClassName='min-h-12 gap-2 px-6 py-2'>
              <span className={index === 1 ? 'font-display font-black text-studio-950' : 'font-display font-black text-gold-300'}>
                {OPTION_LETTERS[index]}:
              </span>
              <span className={index === 1 ? 'truncate text-body-sm font-semibold text-studio-950' : 'truncate text-body-sm font-semibold text-ivory'}>
                {option}
              </span>
            </Lozenge>
          </li>
        ))}
      </ul>
    </div>
  )
}
