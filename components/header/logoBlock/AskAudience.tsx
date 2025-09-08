import { useGameStore } from '@/store/game/store'
import { memo } from 'react'
import { View } from 'react-native'

export default memo(function AskAudience() {
  const {
    lifelines: { askAudience },
  } = useGameStore()

  return <View>Audience</View>
})
