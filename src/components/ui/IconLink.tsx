'use client'

import type { ReactNode } from 'react'
import { Tooltip } from 'antd'
import { cn } from '@helpers/cn'
import { AppLink, type AppLinkProps } from './bare/AppLink'

export type IconLinkProps = Omit<AppLinkProps, 'children'> & {
  /** Required: an icon-only link has no other accessible name. It is also the tooltip. */
  label: string
  icon: ReactNode
}

/** `IconButton`'s look for navigation: a locale-aware link, not a button. */
export const IconLink = ({ label, icon, className, ...rest }: IconLinkProps) => (
  <Tooltip title={label} mouseEnterDelay={0.4}>
    <AppLink
      aria-label={label}
      className={cn(
        'inline-flex size-11 shrink-0 items-center justify-center rounded-control border border-line-strong bg-studio-900/70 text-mist transition-colors hover:border-spot-300 hover:text-ivory',
        className
      )}
      {...rest}
    >
      {icon}
    </AppLink>
  </Tooltip>
)
