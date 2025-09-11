import { ROUTES } from '@/constants/routes'
import { SOUNDS_URIS } from '@/constants/sound'
import { useSound } from '@/hooks/useSound'
import { useSoundStore } from '@/store/sound/store'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { usePathname } from 'expo-router'
import { useState } from 'react'
import { TouchableOpacity, View } from 'react-native'
import ExitModal from './ExitModal'
import LogoBlock from './logoBlock/LogoBlock'

export default function Header() {
  const pathName = usePathname()
  const { toggleActiveSoundMuted, isMuted, activeSoundIdsStack } =
    useSoundStore()
  const [isExitModalVisible, setIsExitModalVisible] = useState(false)

  const soundAPIPromise = useSound(SOUNDS_URIS.mainTheme, { loop: true })

  const soundHandler = async () => {
    console.log({ activeSoundIdsStack })

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
      <View className='flex flex-row gap-md items-center justify'>
        {pathName === ROUTES.game && (
          <TouchableOpacity
            key='header-exit-button'
            onPress={() => setIsExitModalVisible(true)}
            className='h-lg'
          >
            <MaterialIcons
              name='exit-to-app'
              size={24}
              color='#fff'
              className='rotate-180'
            />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={soundHandler} className='h-lg'>
          {isMuted ? (
            <MaterialIcons name='volume-off' size={24} color='#fff' />
          ) : (
            <MaterialCommunityIcons name='volume-high' size={24} color='#fff' />
          )}
        </TouchableOpacity>
      </View>

      <ExitModal
        isVisible={isExitModalVisible}
        onClose={() => setIsExitModalVisible(false)}
      />

      {pathName !== ROUTES.settings && <LogoBlock />}
    </>
  )
}
