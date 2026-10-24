import { cn } from '@helpers/cn'

export type ButtonVariant = 'gold' | 'violet' | 'ghost' | 'outline' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

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
    'relative inline-flex select-none items-center justify-center gap-2 rounded-control border font-display font-bold tracking-wide whitespace-nowrap',
    'aria-disabled:pointer-events-none',
    size === 'sm' && 'h-control text-body-sm [--cut:0.6rem]',
    size === 'md' && 'h-control-lg text-body',
    size === 'lg' && 'h-14 text-h3 [--cut:1rem]',
    variant === 'ghost' && (size === 'sm' ? 'px-3' : 'px-5'),
    variant === 'gold' && 'btn-hex btn-gold',
    variant === 'violet' && 'btn-hex btn-violet',
    variant === 'outline' && 'btn-hex btn-outline',
    variant === 'danger' && 'btn-hex btn-danger',
    variant === 'ghost' && 'border-transparent bg-transparent text-mist transition-colors hover:bg-white/5 hover:text-ivory',
    fullWidth && 'w-full',
    className
  )
