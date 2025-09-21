import { ICONS } from '@/constants/icons'
import { useGameStore } from '@/store/game/store'
import { TouchableOpacity, View } from 'react-native'

export default function SidebarTrigger() {
  const { toggleIsSidebarOpen } = useGameStore()

  return (
    <>
      <View className={`ml-auto`}>
        <TouchableOpacity className='w-6 h-6' onPress={toggleIsSidebarOpen}>
          <ICONS.sidebar />
        </TouchableOpacity>
      </View>
    </>
  )
}
