import mainThemeSound from "@/assets/audio/main_theme.mp3";
import { useStyleByOrientation } from '@/hooks/useStyleByOrientation';
import { useGameStore } from '@/store/game/store';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { TouchableOpacity, View } from 'react-native';


export default function Header() {
  const { toggleActiveSoundMuted, initSound, sound: { activeIdsStack, isMuted } } = useGameStore()

  const style = useStyleByOrientation(
    { width: 160, height: 160 },
    { width: 120, height: 120 }
  )


  const soundHandler = async () => {
    if (!activeIdsStack.length) {
      const { play, setMutedStatus } = await initSound(mainThemeSound, { loop: true })
      play()
      setMutedStatus(false)
      return
    }
    toggleActiveSoundMuted()
  }

  const className = useStyleByOrientation('mb-8', 'mb-2')
  return (
    <View>
      <TouchableOpacity onPress={soundHandler} className='h-lg'>
        {
          isMuted ? (
            <MaterialIcons name="volume-off" size={24} color="#fff" />
          ) : (
            <MaterialCommunityIcons name="volume-high" size={24} color="#fff" />
          )
        }
      </TouchableOpacity>
      <Image
        style={style}
        className={`mx-auto ${className} w-20 h-20`}
        source={require('../assets/images/logo.webp')}
      />
    </View>
  )
}
