
import resignSound from "@/assets/audio/resign.mp3";
import AppLinkAsButton from '@/components/ui/AppLinkAsButton';
import { ROUTES } from '@/constants/routes';
import { useGameStore } from '@/store/game/store';
import { useEffect } from 'react';
import { Text, View } from 'react-native';

export default function Index() {
  const { initSound, playSoundById } = useGameStore()

  useEffect(() => {
    initSound(resignSound)
  }, [initSound])

  return (
    <View className='flex-1 bg-primary'>
      <Text className='text-xl text-center text-white font-bold'>
        Who Wants to Be a Millionaire
      </Text>
      <View className='flex flex-1 justify-center items-center gap-4'>
        <AppLinkAsButton href={ROUTES.game} onPress={() => { playSoundById(resignSound) }}>Start Game</AppLinkAsButton>
        <AppLinkAsButton href={ROUTES.settings}>Settings</AppLinkAsButton>
      </View>
    </View>
  )
}
