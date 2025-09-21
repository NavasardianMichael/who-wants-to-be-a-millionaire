import { LIFELINES } from '@/constants/game'
import { ICONS } from '@/constants/icons'
import { Text } from 'react-native'

export const LIFELINES_TEMPLATE = [
  {
    id: LIFELINES.fiftyFifty,
    icon: (
      <Text style={{ fontSize: 10 }} className='text-secondary font-bold'>
        50/50
      </Text>
    ),
  },
  {
    id: LIFELINES.phoneAFriend,
    icon: <ICONS.phone />,
  },
  {
    id: LIFELINES.askAudience,
    icon: <ICONS.audience />,
  },
  {
    id: LIFELINES.switchQuestion,
    icon: <ICONS.switch />,
  },
]
