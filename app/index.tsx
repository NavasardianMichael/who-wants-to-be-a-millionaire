import AppLinkAsButton from '@/components/ui/AppLinkAsButton'
import { ROUTES } from '@/constants/routes'
import { SOUNDS_URIS } from '@/constants/sound'
import { useSoundStore } from '@/store/sound/store'
import { useEffect } from 'react'
import { Text, View } from 'react-native'

export default function Index() {
  const { initSound, playSoundById } = useSoundStore()

  useEffect(() => {
    initSound(SOUNDS_URIS.resign)
  }, [initSound])

  return (
    <View className='flex-1 bg-primary'>
      <Text className='text-xl text-center text-white font-bold'>
        Who Wants to Be a Millionaire
      </Text>
      <View className='flex flex-1 justify-center items-center gap-4'>
        <AppLinkAsButton
          href={ROUTES.game}
          onPress={() => {
            playSoundById(SOUNDS_URIS.resign)
          }}
        >
          Start Game
        </AppLinkAsButton>
        <AppLinkAsButton href={ROUTES.settings}>Settings</AppLinkAsButton>
      </View>
    </View>
  )
}
