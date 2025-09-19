import { ICONS } from '@/constants/icons'
import { LANGUAGE_NAMES } from '@/constants/settings'
import { Text, View } from 'react-native'

export const LANGUAGE_DROPDOWN_OPTIONS = [
  {
    icon: (
      <View className='flex flex-row items-center gap-sm h-8'>
        <ICONS.en className='h-full border border-primary' />
        <Text>{LANGUAGE_NAMES.en}</Text>
      </View>
    ),
    value: 'en',
  },
  {
    label: (
      <View className='flex flex-row items-center gap-sm h-8'>
        <ICONS.ru className='h-full border border-primary' />
        <Text>{LANGUAGE_NAMES.ru}</Text>
      </View>
    ),
    value: 'ru',
  },
  {
    label: (
      <View className='flex flex-row items-center gap-sm h-8'>
        <ICONS.am className='h-full border border-primary' />
        <Text>{LANGUAGE_NAMES.am}</Text>
      </View>
    ),
    value: 'am',
  },
]
