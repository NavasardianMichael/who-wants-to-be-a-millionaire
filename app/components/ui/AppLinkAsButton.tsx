import { Link, LinkProps } from 'expo-router'
import React, { FC } from 'react'

type Props = LinkProps

const AppLinkAsButton: FC<Props> = ({
  children,
  href,
  className,
  ...restProps
}) => {
  return (
    <Link
      href={href}
      className={`w-60 bg-primary py-4 px-8 text-center rounded-md text-secondary border border-secondary ${className}`}
      {...restProps}
    >
      {children}
    </Link>
  )
}

export default AppLinkAsButton
