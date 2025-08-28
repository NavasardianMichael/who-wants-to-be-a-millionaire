import { Text, View } from 'react-native'
import AppLinkAsButton from './components/ui/AppLinkAsButton'
import { ROUTES } from './constants/routes'
import './globals.css'

export default function Index() {
  return (
    <View className='flex-1 bg-primary'>
      <Text className='text-2xl text-center text-white font-bold'>
        Who Wants to Be a Millionaire
      </Text>
      <View className='flex flex-1 justify-center items-center gap-4'>
        <AppLinkAsButton href={ROUTES.startGame}>Start Game</AppLinkAsButton>
        <AppLinkAsButton href={ROUTES.settings} className='w-60'>
          Settings
        </AppLinkAsButton>
      </View>
    </View>
  )
}
