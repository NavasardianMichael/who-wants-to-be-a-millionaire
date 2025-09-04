import { useStyleByOrientation } from '@/hooks/useStyleByOrientation';
import { useGameStore } from '@/store/game/store';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { TouchableOpacity, View } from 'react-native';


export default function Header() {
  const { toggleActiveSoundMuted, sound: { isMuted } } = useGameStore()

  const style = useStyleByOrientation(
    { width: 120, height: 120 },
    { width: 100, height: 100 }
  )

  const className = useStyleByOrientation('mb-8', 'mb-2')
  return (
    <View>
      <TouchableOpacity onPress={toggleActiveSoundMuted} className='h-lg'>
        {
          isMuted ? (
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
