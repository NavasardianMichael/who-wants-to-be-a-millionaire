import { CHAR_CODES_BY_OPTION_SERIAL_NUMBER } from '@/constants/game'
import { useStyleByOrientation } from '@/hooks/useStyleByOrientation'
import { useGameStore } from '@/store/game/store'
import AntDesign from '@expo/vector-icons/AntDesign'
import { memo } from 'react'
import { Image, Text, TouchableOpacity, View } from 'react-native'

export default memo(function PhoneAFriend() {
  const {
    lifelines: { phoneAFriend },
    setCurrentLifeline
  } = useGameStore()

  const style = useStyleByOrientation(
    { width: 160, height: 160 },
    { width: 120, height: 120 }
  )
  const className = useStyleByOrientation('mb-8', 'mb-2')

  return (
    <View className='mx-auto relative max-w-60'>
      <Image
        style={style}
        className={`mx-auto ${className} w-20 h-20`}
        source={require('../../../assets/images/call-a-friend.png')}
      />
      {
        phoneAFriend?.suggestedOptionSerialNumber && (
          <Text className='text-center text-secondary text-lg'>I think the answer is <Text className='font-bold'>{CHAR_CODES_BY_OPTION_SERIAL_NUMBER[phoneAFriend.suggestedOptionSerialNumber]}</Text></Text>
        )
      }
      <TouchableOpacity className={`z-10 absolute -top-4 -right-4 rounded-full bg-primary ${!phoneAFriend ? 'opacity-50' : 'opacity-100'}`} onPress={() => { setCurrentLifeline(null) }} disabled={!phoneAFriend}>
        <AntDesign name="closecircle" size={36} color="#fff" />
      </TouchableOpacity>
    </View>
  )
})
