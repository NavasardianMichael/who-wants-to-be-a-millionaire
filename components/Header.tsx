import mainThemeSound from "@/assets/audio/main_theme.mp3";
import { useSound } from '@/hooks/useSound';
import { useStyleByOrientation } from '@/hooks/useStyleByOrientation';
import { useGameStore } from '@/store/game/store';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';


export default function Header() {
  const [isSoundOn, setIsSoundOn] = useState(false)
  const { currentSound, setCurrentSound } = useGameStore()
  const mainThemeSoundAPI = useSound(mainThemeSound)
  const style = useStyleByOrientation(
    { width: 120, height: 120 },
    { width: 100, height: 100 }
  )

  useEffect(() => {
    setCurrentSound(mainThemeSoundAPI)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (isSoundOn) {
      currentSound?.play();
      return
    }
    currentSound?.stop()
  }, [isSoundOn, currentSound])


  const className = useStyleByOrientation('mb-8', 'mb-2')
  return (
    <View>
      <TouchableOpacity onPress={() => setIsSoundOn((prev) => !prev)} className='h-lg'>
        {
          isSoundOn ? (
            <MaterialCommunityIcons name="volume-high" size={24} color="#fff" />
          ) : (
            <MaterialIcons name="volume-off" size={24} color="#fff" />
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
