import { ICONS } from '@/constants/icons'
import { useGameStore } from '@/store/game/store'
import { Pressable, TouchableOpacity, View } from 'react-native'

export default function Sidebar() {
  const { isSidebarOpen, setIsSidebarOpen } = useGameStore()

  return (
    <View className={`ml-auto`}>
      <TouchableOpacity
        className={`w-6 h-6 z-20 m-lg ${isSidebarOpen ? 'rotate-180' : ''}`}
        onPress={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        <ICONS.sidebar />
      </TouchableOpacity>
      {isSidebarOpen && (
        <Pressable onPress={() => setIsSidebarOpen(false)}>
          <View className='ml-auto bg-primary opacity-80' />
        </Pressable>
      )}
    </View>
  )
}
