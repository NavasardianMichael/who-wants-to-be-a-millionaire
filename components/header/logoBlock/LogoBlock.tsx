import { LIFELINES } from '@/constants/game'
import { useIsPortrait } from '@/hooks/useIsPortrait'
import { useStyleByOrientation } from '@/hooks/useStyleByOrientation'
import { useGameStore } from '@/store/game/store'
import { memo } from 'react'
import { Image } from 'react-native'
import AskAudience from './AskAudience'
import PhoneAFriend from './PhoneAFriend'

export default memo(function LogoBlock() {
  const {
    lifelines: { current },
  } = useGameStore()
  const style = useStyleByOrientation(
    { width: 160, height: 160 },
    { width: 120, height: 120 }
  )
  const className = useStyleByOrientation('mb-8', 'mb-2')

  const isPortrait = useIsPortrait()

  if (
    isPortrait ||
    (current !== LIFELINES.askAudience && current !== LIFELINES.phoneAFriend)
  ) {
    return (
      <Image
        style={style}
        className={`mx-auto ${className} w-20 h-20`}
        source={require('../../../assets/images/logo.webp')}
      />
    )
  }

  if (current === LIFELINES.askAudience) return <AskAudience />

  return <PhoneAFriend />
})
