import { type ButtonHTMLAttributes, forwardRef, type ReactNode } from 'react'
import { cn } from '@helpers/cn'

export type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Required: an icon-only control has no other accessible name. */
  label: string
  icon: ReactNode
  tone?: 'default' | 'gold'
  size?: 'md' | 'lg'
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, icon, tone = 'default', size = 'md', className, type = 'button', ...rest }, ref) => (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full border transition-[transform,background-color,border-color,color] duration-200',
        'active:scale-95 disabled:pointer-events-none disabled:opacity-40',
        size === 'md' ? 'size-11' : 'size-12',
        tone === 'default' &&
          'border-spot-300/25 bg-studio-900/70 text-mist hover:border-spot-300/60 hover:bg-studio-800 hover:text-ivory',
        tone === 'gold' && 'border-gold-400/60 bg-studio-900/70 text-gold-300 hover:bg-gold-400/15 hover:text-gold-200',
        className
      )}
      {...rest}
    >
      {icon}
    </button>
  )
)

IconButton.displayName = 'IconButton'
