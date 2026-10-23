import { cn } from '@helpers/cn'

export type SpinnerProps = { size?: 'sm' | 'md' | 'lg'; className?: string; label?: string }

/** Decorative unless a `label` is given; a busy button announces itself via `aria-busy`. */
export const Spinner = ({ size = 'md', className, label }: SpinnerProps) => (
  <span
    role={label ? 'status' : undefined}
    aria-label={label}
    aria-hidden={label ? undefined : true}
    className={cn(
      'inline-block animate-spin rounded-full border-2 border-current border-t-transparent',
      size === 'sm' && 'size-4',
      size === 'md' && 'size-6',
      size === 'lg' && 'size-10 border-[3px]',
      className
    )}
  />
)
