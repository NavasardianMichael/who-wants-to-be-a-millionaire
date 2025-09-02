import { LIFELINES } from '@/constants/game'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import { Text } from 'react-native'

export const LIFELINES_TEMPLATE = [
  {
    id: LIFELINES.fiftyFifty,
    icon: (
      <Text className='text-[.65rem] text-secondary font-bold'>
        50/50
      </Text>
    ),
  },
  {
    id: LIFELINES.phoneAFriend,
    icon: <FontAwesome name='phone' size={16} color='#fff' />,
  },
  {
    id: LIFELINES.askAudience,
    icon: <FontAwesome5 name='users' size={16} color='#fff' />,
  },
  {
    id: LIFELINES.switchQuestion,
    icon: <FontAwesome name='refresh' size={16} color='#fff' />,
  },
]