import { Link, LinkProps } from 'expo-router'
import React, { FC, memo, useMemo } from 'react'

type Props = LinkProps

const AppLinkAsButton: FC<Props> = ({
  children,
  href,
  className,
  ...restProps
}) => {
  const combinedClassName = useMemo(() => {
    return `min-w-[300px] box-border py-sm px-md text-center rounded-md text-secondary border border-secondary ${className}`
  }, [className])

  return (
    <Link href={href} className={combinedClassName} {...restProps}>
      {children}
    </Link>
  )
}

export default memo(AppLinkAsButton)
