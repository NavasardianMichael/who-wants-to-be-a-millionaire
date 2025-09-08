import { useGameStore } from '@/store/game/store'
import { memo } from 'react'
import { View } from 'react-native'

export default memo(function PhoneAFriend() {
  const {
    lifelines: { phoneAFriend },
  } = useGameStore()

  return <View>Phone a Friend</View>
})
