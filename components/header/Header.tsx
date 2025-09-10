import { ROUTES } from '@/constants/routes'
import { SOUNDS_URIS } from '@/constants/sound'
import { useSound } from '@/hooks/useSound'
import { useSoundStore } from '@/store/sound/store'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { usePathname } from 'expo-router'
import { TouchableOpacity } from 'react-native'
import LogoBlock from './logoBlock/LogoBlock'

export default function Header() {
  const pathName = usePathname()
  const { toggleActiveSoundMuted, isMuted, activeSoundIdsStack } =
    useSoundStore()

  const soundAPIPromise = useSound(SOUNDS_URIS.mainTheme, { loop: true })

  const soundHandler = async () => {
    if (!activeSoundIdsStack.length) {
      const soundAPI = await soundAPIPromise
      soundAPI.play()
      soundAPI.setMutedStatus(false)
      return
    }
    toggleActiveSoundMuted()
  }

  return (
    <>
      <TouchableOpacity onPress={soundHandler} className='h-lg'>
        {isMuted ? (
          <MaterialIcons name='volume-off' size={24} color='#fff' />
        ) : (
          <MaterialCommunityIcons name='volume-high' size={24} color='#fff' />
        )}
      </TouchableOpacity>

      {pathName !== ROUTES.settings && <LogoBlock />}
    </>
  )
}
