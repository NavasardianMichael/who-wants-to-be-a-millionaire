import { Link, LinkProps } from 'expo-router'
import React, { FC, memo, useMemo } from 'react'
import { Text } from 'react-native'

type Props = LinkProps

const AppExoticLink: FC<Props> = ({
  children,
  href,
  className,
  ...restProps
}) => {
  const combinedClassName = useMemo(() => {
    return ` py-sm px-md text-center rounded-md text-secondary border border-secondary relative text-white font-bold text-lg cursor-pointer
         [clip-path:polygon(10%_0%,90%_0%,100%_50%,90%_100%,10%_100%,0%_50%)] 
         bg-gradient-to-b from-gradient-from to-gradient-to ${className}`
  }, [className])

  return (
    <Link href={href} className={combinedClassName} {...restProps}>
      <Text className='relative z-10 text-secondary'>{children}</Text>

      <Text
        className='absolute inset-0 
           bg-secondary
           [clip-path:polygon(10%_0%,90%_0%,100%_50%,90%_100%,10%_100%,0%_50%)]'
      ></Text>

      <Text className='absolute bg-gradient-to-b from-gradient-from to-gradient-to [clip-path:polygon(10%_0%,90%_0%,100%_50%,90%_100%,10%_100%,0%_50%)]' />
    </Link>
  )
}

export default memo(AppExoticLink)
