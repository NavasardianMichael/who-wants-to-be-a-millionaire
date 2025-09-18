import React, { FC, memo, useMemo } from 'react'
import { TouchableOpacity, TouchableOpacityProps } from 'react-native'

type Props = TouchableOpacityProps

const AppButton: FC<Props> = ({ children, className, ...restProps }) => {
  const combinedClassName = useMemo(() => {
    return `min-w-300 box-border py-sm px-md text-center rounded-md text-secondary border border-secondary ${className}`
  }, [className])

  return (
    <TouchableOpacity className={combinedClassName} {...restProps}>
      {children}
    </TouchableOpacity>
  )
}

export default memo(AppButton)
