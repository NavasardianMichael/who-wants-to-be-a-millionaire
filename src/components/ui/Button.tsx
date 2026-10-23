import { type ButtonHTMLAttributes, forwardRef, type ReactNode } from 'react'
import { cn } from '@helpers/cn'
import { Spinner } from './Spinner'

export type ButtonVariant = 'gold' | 'blue' | 'ghost' | 'outline' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

/** Shared with `ButtonLink`, so a link styled as a button is pixel-identical. */
export const buttonClassName = ({
  variant = 'gold',
  size = 'md',
  fullWidth,
  className,
}: {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  className?: string
}) =>
  cn(
    'relative inline-flex select-none items-center justify-center gap-2 overflow-hidden rounded-full font-display font-bold tracking-wide whitespace-nowrap',
    'transition-[transform,filter,box-shadow,background-color] duration-200 ease-[var(--ease-show)]',
    'active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50',
    size === 'sm' && 'min-h-10 px-4 text-body-sm',
    size === 'md' && 'min-h-12 px-6 text-body',
    size === 'lg' && 'min-h-14 px-8 text-h3',
    variant === 'gold' &&
      'bg-[linear-gradient(180deg,var(--color-gold-200),var(--color-gold-400)_55%,var(--color-gold-500))] text-studio-950 shadow-glow-gold hover:brightness-110',
    variant === 'blue' &&
      'bg-[linear-gradient(180deg,var(--color-spot-500),var(--color-studio-600))] text-ivory shadow-glow-spot hover:brightness-115',
    variant === 'ghost' && 'bg-transparent text-mist hover:bg-white/5 hover:text-ivory',
    variant === 'outline' && 'border border-spot-300/40 bg-studio-900/60 text-ivory hover:border-gold-300 hover:text-gold-200',
    variant === 'danger' &&
      'bg-[linear-gradient(180deg,var(--color-wrong-500),var(--color-wrong-700))] text-ivory shadow-glow-wrong hover:brightness-110',
    fullWidth && 'w-full',
    className
  )

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  loading?: boolean
  icon?: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant, size, fullWidth, loading, icon, className, children, type = 'button', disabled, ...rest }, ref) => (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClassName({ variant, size, fullWidth, className })}
      {...rest}
    >
      {loading ? <Spinner size='sm' /> : icon}
      {children}
    </button>
  )
)

Button.displayName = 'Button'
