import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@helpers/cn'

/**
 * The show's stretched hexagon — the shape of every question and answer panel. Rim and
 * fill come from the `--rim-*` / `--fill-*` custom properties (globals.css §5), so state
 * colours are a style, not a new component.
 */
export type LozengeTone = 'idle' | 'gold' | 'selected' | 'locked' | 'correct' | 'wrong' | 'dim'

const TONES: Record<LozengeTone, CSSProperties> = {
  idle: {},
  gold: {
    '--rim-from': 'var(--color-gold-600)',
    '--rim-to': 'var(--color-gold-200)',
  } as CSSProperties,
  selected: {
    '--rim-from': 'var(--color-lock-700)',
    '--rim-to': 'var(--color-lock-300)',
  } as CSSProperties,
  locked: {
    '--rim-from': 'var(--color-lock-700)',
    '--rim-to': 'var(--color-lock-300)',
    '--fill-from': 'var(--color-lock-300)',
    '--fill-to': 'var(--color-lock-700)',
  } as CSSProperties,
  correct: {
    '--rim-from': 'var(--color-correct-700)',
    '--rim-to': 'var(--color-correct-300)',
    '--fill-from': 'var(--color-correct-300)',
    '--fill-to': 'var(--color-correct-700)',
  } as CSSProperties,
  wrong: {
    '--rim-from': 'var(--color-wrong-700)',
    '--rim-to': 'var(--color-wrong-300)',
    '--fill-from': 'var(--color-wrong-300)',
    '--fill-to': 'var(--color-wrong-700)',
  } as CSSProperties,
  dim: {
    '--rim-from': 'var(--color-studio-700)',
    '--rim-to': 'var(--color-studio-600)',
  } as CSSProperties,
}

export type LozengeProps = {
  tone?: LozengeTone
  /** Draw the horizontal line that runs off both edges behind the panel. */
  wire?: boolean
  className?: string
  fillClassName?: string
  children: ReactNode
}

export const Lozenge = ({ tone = 'idle', wire, className, fillClassName, children }: LozengeProps) => (
  <div className={cn('relative', className)}>
    {wire && <span aria-hidden className='lozenge-wire' />}
    <div className='lozenge h-full' style={TONES[tone]}>
      <div className={cn('lozenge-fill flex items-center', fillClassName)}>{children}</div>
    </div>
  </div>
)
