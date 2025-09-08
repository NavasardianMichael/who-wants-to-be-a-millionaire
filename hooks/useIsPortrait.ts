import { useMemo } from 'react'
import { useWindowDimensions } from 'react-native'

/**
 * @returns {boolean} Whether the device is in portrait orientation.
 *
 * @example
 * const isPortrait = useIsPortrait()
 * return <View className={isPortrait ? "flex-col p-4" : "flex-row p-8"}>...</View>
 */

export const useIsPortrait = (): boolean => {
  const { width, height } = useWindowDimensions()

  return useMemo(() => {
    return width < height
  }, [width, height])
}
