import { LANGUAGE_NAMES } from '@/constants/settings'
import { Image, Text, View } from 'react-native'

export const LANGUAGE_DROPDOWN_OPTIONS = [
  {
    label: (
      <View className='flex flex-row items-center gap-sm h-full'>
        <Image
          source={require('@/assets/icons/en.svg')}
          className='h-full border border-primary'
        />
        <Text>{LANGUAGE_NAMES.en}</Text>
      </View>
    ),
    value: 'en',
  },
  {
    label: (
      <View className='flex flex-row items-center gap-sm h-full'>
        <Image
          source={require('@/assets/icons/ru.svg')}
          className='h-full border border-primary'
        />
        <Text>{LANGUAGE_NAMES.ru}</Text>
      </View>
    ),
    value: 'ru',
  },
  {
    label: (
      <View className='flex flex-row items-center gap-sm h-full'>
        <Image
          source={require('@/assets/icons/am.svg')}
          className='h-full border border-primary'
        />
        <Text>{LANGUAGE_NAMES.am}</Text>
      </View>
    ),
    value: 'am',
  },
]
