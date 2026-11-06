import type { ComponentProps } from 'react'
import { Link } from '@i18n/navigation'
import { cn } from '@helpers/cn'
import { buttonClassName, type ButtonSize, type ButtonVariant } from './buttonClassName'
import { LinkPending } from '../LinkPending'

/** The single internal-anchor primitive: locale-prefixed via `@i18n/navigation`. */
export type AppLinkProps = ComponentProps<typeof Link>

/** While the next page loads, the link pulses, so a slow navigation still shows the click landed. */
export const AppLink = ({ className, children, ...rest }: AppLinkProps) => (
  <Link
    className={cn(
      'has-[[data-link-pending]]:animate-link-pending has-[[data-link-pending]]:cursor-progress',
      className as string | undefined
    )}
    {...rest}
  >
    {children}
    <LinkPending />
  </Link>
)

export type ButtonLinkProps = AppLinkProps & { variant?: ButtonVariant; size?: ButtonSize; fullWidth?: boolean }

/** A link that looks like a `Button` — for navigation, never for actions. A spinner shows while the next page loads. */
export const ButtonLink = ({ variant, size, fullWidth, className, children, ...rest }: ButtonLinkProps) => (
  <Link
    className={buttonClassName({
      variant,
      size,
      fullWidth,
      className: cn('has-[[data-link-pending]]:cursor-progress', className as string | undefined),
    })}
    {...rest}
  >
    {children}
    <LinkPending spinner />
  </Link>
)
