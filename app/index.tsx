import AppLinkAsButton from '@/components/ui/AppLinkAsButton'
import { ROUTES } from '@/constants/routes'
import { Text, View } from 'react-native'

export default function Index() {
  return (
    <View className='flex-1 bg-primary'>
      <Text className='text-xl text-center text-white font-bold'>
        Who Wants to Be a Millionaire
      </Text>
      <View className='flex flex-1 justify-center items-center gap-4'>
        <AppLinkAsButton href={ROUTES.game}>Start Game</AppLinkAsButton>
        <AppLinkAsButton href={ROUTES.settings}>Settings</AppLinkAsButton>
      </View>
    </View>
  )
}
