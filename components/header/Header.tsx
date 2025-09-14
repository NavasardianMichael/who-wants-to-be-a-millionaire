import { ROUTES } from '@/constants/routes'
import { SOUNDS_URIS } from '@/constants/sound'
import { useSound } from '@/hooks/useSound'
import { useSoundStore } from '@/store/sound/store'
import { usePathname } from 'expo-router'
import { useState } from 'react'
import { Image, TouchableOpacity, View } from 'react-native'
import ExitModal from './ExitModal'
import LanguagesDropdown from './LanguagesDropdown'
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
            className='h-[24px] rotate-180'
          >
            <Image source={require('@/assets/icons/exit.svg')} />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={soundHandler} className='h-[24px]'>
          {isMuted ? (
            <Image source={require('@/assets/icons/volume-off.svg')} />
          ) : (
            <Image source={require('@/assets/icons/volume-on.svg')} />
          )}
        </TouchableOpacity>
        {pathName === ROUTES.home && (
          <View className='ml-auto'>
            <LanguagesDropdown />
          </View>
        )}
      </View>

      <ExitModal
        isVisible={isExitModalVisible}
        onClose={() => setIsExitModalVisible(false)}
      />

      {pathName !== ROUTES.settings && <LogoBlock />}
    </>
  )
}
