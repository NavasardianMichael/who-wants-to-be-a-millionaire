import { SOUNDS_URIS } from '@/constants/sound'
import { useGameStore } from '@/store/game/store'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { TouchableOpacity, View } from 'react-native'
import LogoBlock from './logoBlock/LogoBlock'

export default function Header() {
  const {
    toggleActiveSoundMuted,
    initSound,
    sound: { activeIdsStack, isMuted },
  } = useGameStore()

  const soundHandler = async () => {
    if (!activeIdsStack.length) {
      const { play, setMutedStatus } = await initSound(SOUNDS_URIS.mainTheme, {
        loop: true,
      })
      play()
      setMutedStatus(false)
      return
    }
    toggleActiveSoundMuted()
  }

  return (
    <View>
      <TouchableOpacity onPress={soundHandler} className='h-lg'>
        {isMuted ? (
          <MaterialIcons name='volume-off' size={24} color='#fff' />
        ) : (
          <MaterialCommunityIcons name='volume-high' size={24} color='#fff' />
        )}
      </TouchableOpacity>
      <LogoBlock />
    </View>
  )
}
