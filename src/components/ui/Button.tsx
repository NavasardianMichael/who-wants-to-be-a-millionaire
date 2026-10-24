'use client'

import { type ButtonHTMLAttributes, forwardRef, type ReactNode } from 'react'
import { Button as AntButton } from 'antd'
import { cn } from '@helpers/cn'
import type { ButtonSize, ButtonVariant } from './bare/buttonClassName'

export type { ButtonSize, ButtonVariant } from './bare/buttonClassName'

export type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'color'> & {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  loading?: boolean
  icon?: ReactNode
  type?: 'button' | 'submit' | 'reset'
}

/**
 * antd's `Button` in the show's shape and finishes. antd supplies focus, loading and disabled
 * behaviour; `btn-hex` + a variant (globals.css §8) draws the hexagon, rim, gloss and glow —
 * utilities sit in a higher cascade layer than antd, so they win without `!important`.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'gold', size = 'md', fullWidth, loading, icon, className, type = 'button', ...rest }, ref) => (
    <AntButton
      ref={ref}
      htmlType={type}
      type={variant === 'gold' ? 'primary' : variant === 'ghost' ? 'text' : variant === 'danger' ? 'primary' : 'default'}
      danger={variant === 'danger'}
      size={size === 'sm' ? 'middle' : 'large'}
      block={fullWidth}
      loading={loading}
      icon={icon}
      className={cn(
        'font-bold',
        // The hexagon's padding follows its point depth (`--cut`); only the flat ghost pads itself.
        size === 'sm' && 'text-body-sm [--cut:0.6rem]',
        size === 'md' && 'text-body',
        size === 'lg' && 'h-14 text-h3 [--cut:1rem]',
        variant === 'ghost' && (size === 'sm' ? 'px-3' : 'px-5'),
        variant === 'gold' && 'btn-hex btn-gold',
        variant === 'violet' && 'btn-hex btn-violet',
        variant === 'outline' && 'btn-hex btn-outline',
        variant === 'danger' && 'btn-hex btn-danger',
        variant === 'ghost' && 'text-mist hover:text-ivory',
        className
      )}
      {...rest}
    />
  )
)

Button.displayName = 'Button'
