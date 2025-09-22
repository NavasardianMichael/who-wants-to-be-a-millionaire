import VolumeOffIcon from '@/assets/icons/volume-off.svg'
import VolumeOnIcon from '@/assets/icons/volume-on.svg'
import { ICONS } from '@/constants/icons'
import { ROUTES } from '@/constants/routes'
import { SOUNDS_URIS } from '@/constants/sound'
import { useSound } from '@/hooks/useSound'
import { useSoundStore } from '@/store/sound/store'
import { usePathname } from 'expo-router'
import { useState } from 'react'
import { TouchableOpacity, View } from 'react-native'
import SidebarTrigger from '../game/Sidebar/SidebarTrigger'
import ExitModal from './ExitModal'
import LanguagesDropdown from './LanguagesDropdown'
import LogoBlock from './logoBlock/LogoBlock'

export default function Header() {
  const pathName = usePathname()
  const {
    setSoundState,
    soundAPIById,
    toggleActiveSoundMuted,
    setIsActiveSoundMuted,
    isMuted,
    activeSoundIdsStack,
  } = useSoundStore()
  const [isExitModalVisible, setIsExitModalVisible] = useState(false)

  useSound(SOUNDS_URIS.mainTheme, { loop: true })
  useSound(SOUNDS_URIS.easy, { loop: true })

  const soundHandler = async () => {
    if (!activeSoundIdsStack.length && isMuted) {
      const soundId =
        pathName === ROUTES.home ? SOUNDS_URIS.mainTheme : SOUNDS_URIS.easy
      setSoundState({
        activeSoundIdsStack: [soundId],
      })
      soundAPIById[soundId].play()
      setIsActiveSoundMuted(false)
      return
    }
    toggleActiveSoundMuted()
  }

  return (
    <>
      <View className='flex flex-row gap-md items-center justify'>
        <TouchableOpacity onPress={soundHandler} className='h-6 w-6'>
          {isMuted ? <VolumeOffIcon /> : <VolumeOnIcon />}
        </TouchableOpacity>
        {pathName === ROUTES.game && (
          <TouchableOpacity
            key='header-exit-button'
            onPress={() => setIsExitModalVisible(true)}
            className='h-6 rotate-180'
          >
            <ICONS.exit />
          </TouchableOpacity>
        )}
        {pathName === ROUTES.home && (
          <View className='ml-auto'>
            <LanguagesDropdown />
          </View>
        )}
        {pathName === ROUTES.game && <SidebarTrigger />}
      </View>

      <ExitModal
        isVisible={isExitModalVisible}
        onClose={() => setIsExitModalVisible(false)}
      />

      <LogoBlock />
    </>
  )
}
