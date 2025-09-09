import { LIFELINES } from '@/constants/game'
import { useIsPortrait } from '@/hooks/useIsPortrait'
import { useStyleByOrientation } from '@/hooks/useStyleByOrientation'
import { useLifelinesStore } from '@/store/lifelines/store'
import { memo, useMemo } from 'react'
import { Image, View } from 'react-native'
import DisplayCurrentLifeline from './DisplayCurrentLifeline'

export default memo(function LogoBlock() {
  const { currentLifeline } = useLifelinesStore()
  const style = useStyleByOrientation(
    { width: 160, height: 160 },
    { width: 120, height: 120 }
  )
  const className = useStyleByOrientation('mb-8', 'mb-2')

  const isPortrait = useIsPortrait()
  const showLifeline = useMemo(() => {
    return !(
      currentLifeline !== LIFELINES.askAudience &&
      currentLifeline !== LIFELINES.phoneAFriend
    )
  }, [currentLifeline])

  if (isPortrait) {
    return (
      <View className='flex-1 flex flex-col gap-md'>
        <Image
          style={style}
          className={`mx-auto ${className} w-20 h-20`}
          source={require('../../../assets/images/logo.webp')}
        />
        {showLifeline && <DisplayCurrentLifeline />}
      </View>
    )
  } else {
    return (
      <>
        {showLifeline ? (
          <DisplayCurrentLifeline />
        ) : (
          <Image
            style={style}
            className={`mx-auto ${className} w-20 h-20`}
            source={require('../../../assets/images/logo.webp')}
          />
        )}
      </>
    )
  }
})
