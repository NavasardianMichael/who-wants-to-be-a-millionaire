import { useMemo } from 'react'
import { StyleProp } from 'react-native'
import { useIsPortrait } from './useIsPortrait'

/**
 * A hook that returns a className depending on the device orientation.
 *
 * @param {string} portraitClassName - class name to use in portrait orientation.
 * @param {string} landscapeClassName - class name to use in landscape orientation.
 * @returns {string} The class name corresponding to the current orientation.
 *
 * @example
 * const className = useClassNameByOrientation("flex-col p-4", "flex-row p-8")
 * return <View className={className}>...</View>
 */

export const useStyleByOrientation = <T>(
  portraitStyles: StyleProp<T>,
  landscapeStyles: StyleProp<T>
): StyleProp<T> => {
  const isPortrait = useIsPortrait()

  return useMemo(() => {
    return isPortrait ? portraitStyles : landscapeStyles
  }, [isPortrait, portraitStyles, landscapeStyles])
}
