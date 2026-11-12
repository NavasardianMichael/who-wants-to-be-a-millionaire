import { cn } from '@helpers/cn'

/** `gold` is the primary action; `secondary` is the one look for every action beside or below it. */
export type ButtonVariant = 'gold' | 'violet' | 'secondary' | 'ivory' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

/**
 * A label wraps between words, then inside a word too long for the line, and the button grows
 * taller instead of letting text spill past its edges. The height per size is a minimum.
 */
export const buttonWrapClassName = (size: ButtonSize) =>
  cn(
    'h-auto max-w-full py-1.5 text-center leading-tight text-balance whitespace-normal wrap-anywhere',
    size === 'sm' && 'min-h-control',
    size === 'md' && 'min-h-control-lg',
    size === 'lg' && 'min-h-14'
  )

/**
 * Button looks as classes, for the two places an antd `Button` cannot go: `ButtonLink` (a
 * server-rendered locale link) and the Google sign-in anchor. `Button` uses the same
 * variant utilities on top of antd, so a link and a button side by side match.
 */
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
    'relative inline-flex select-none items-center justify-center gap-2 rounded-control border font-display font-bold tracking-wide',
    'aria-disabled:pointer-events-none',
    buttonWrapClassName(size),
    size === 'sm' && 'text-body-sm [--cut:0.6rem]',
    size === 'md' && 'text-body',
    size === 'lg' && 'text-h3 [--cut:1rem]',
    variant === 'gold' && 'btn-hex btn-gold',
    variant === 'violet' && 'btn-hex btn-violet',
    variant === 'secondary' && 'btn-hex btn-outline',
    variant === 'ivory' && 'btn-hex btn-ivory',
    variant === 'danger' && 'btn-hex btn-danger',
    fullWidth && 'w-full',
    className
  )
