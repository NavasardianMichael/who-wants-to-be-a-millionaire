'use client'

import { type ButtonHTMLAttributes, forwardRef, type ReactNode } from 'react'
import { Button as AntButton, Tooltip } from 'antd'
import { cn } from '@helpers/cn'

export type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'color'> & {
  /** Required: an icon-only control has no other accessible name. It is also the tooltip. */
  label: string
  icon: ReactNode
  tone?: 'default' | 'gold'
  size?: 'md' | 'lg'
  /** The tooltip is skipped where the label is already visible nearby. */
  tooltip?: boolean
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, icon, tone = 'default', size = 'md', tooltip = true, className, ...rest }, ref) => {
    const button = (
      <AntButton
        ref={ref}
        htmlType='button'
        aria-label={label}
        icon={icon}
        size='large'
        className={cn(
          'shrink-0',
          size === 'md' ? 'size-11' : 'size-12',
          tone === 'default' && 'border-line-strong bg-studio-900/70 text-mist hover:text-ivory',
          tone === 'gold' && 'border-gold-400/60 bg-studio-900/70 text-gold-300 hover:bg-gold-400/15 hover:text-gold-200',
          className
        )}
        {...rest}
      />
    )
    return tooltip ? (
      <Tooltip title={label} mouseEnterDelay={0.4}>
        {button}
      </Tooltip>
    ) : (
      button
    )
  }
)

IconButton.displayName = 'IconButton'
