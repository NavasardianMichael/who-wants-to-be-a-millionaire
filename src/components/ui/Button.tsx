'use client'

import { type ButtonHTMLAttributes, forwardRef, type ReactNode } from 'react'
import { Button as AntButton } from 'antd'
import { cn } from '@helpers/cn'
import { type ButtonSize, type ButtonVariant, buttonWrapClassName } from './bare/buttonClassName'

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
      type={variant === 'gold' || variant === 'danger' ? 'primary' : 'default'}
      danger={variant === 'danger'}
      size={size === 'sm' ? 'middle' : 'large'}
      block={fullWidth}
      loading={loading}
      icon={icon}
      className={cn(
        'font-bold',
        // antd fixes the height and forbids wrapping; a long label grows the button instead.
        buttonWrapClassName(size),
        // The hexagon's padding follows its point depth (`--cut`).
        size === 'sm' && 'text-body-sm [--cut:0.6rem]',
        size === 'md' && 'text-body',
        size === 'lg' && 'text-h3 [--cut:1rem]',
        variant === 'gold' && 'btn-hex btn-gold',
        variant === 'violet' && 'btn-hex btn-violet',
        variant === 'secondary' && 'btn-hex btn-outline',
        variant === 'ivory' && 'btn-hex btn-ivory',
        variant === 'danger' && 'btn-hex btn-danger',
        className
      )}
      {...rest}
    />
  )
)

Button.displayName = 'Button'
