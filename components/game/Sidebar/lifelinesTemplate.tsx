import { LIFELINES } from '@/constants/game'
import { Image, Text } from 'react-native'

export const LIFELINES_TEMPLATE = [
  {
    id: LIFELINES.fiftyFifty,
    icon: <Text className='text-[.8rem] text-secondary font-bold'>50/50</Text>,
  },
  {
    id: LIFELINES.phoneAFriend,
    icon: <Image source={require('@/assets/icons/phone.svg')} />,
  },
  {
    id: LIFELINES.askAudience,
    icon: <Image source={require('@/assets/icons/audience.svg')} />,
  },
  {
    id: LIFELINES.switchQuestion,
    icon: <Image source={require('@/assets/icons/switch.svg')} />,
  },
]
