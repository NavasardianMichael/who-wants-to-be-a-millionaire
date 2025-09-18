import { ICONS } from '@/constants/icons'
import { useGameStore } from '@/store/game/store'
import { Pressable, TouchableOpacity, View } from 'react-native'
import SidebarContent from './SidebarContent'

export default function Sidebar() {
  const { isSidebarOpen, setIsSidebarOpen } = useGameStore()

  return (
    <View className={`flex flex-col w-80 ml-auto -mr-8`}>
      <TouchableOpacity
        className='w-6 h-6 z-20 m-lg'
        onPress={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        <ICONS.sidebar className={` ${isSidebarOpen ? 'rotate-180' : ''}`} />
      </TouchableOpacity>
      {isSidebarOpen && (
        <Pressable onPress={() => setIsSidebarOpen(false)}>
          <View className='ml-auto bg-primary opacity-80' />
        </Pressable>
      )}
      <View
        className={`w-full h-full absolute top-0 right-0 bottom-0 z-10 p-md py-3 box-border transition ${!isSidebarOpen && 'translate-x-full'} bg-indigo-700 border-l border-l-secondary h-full flex-1`}
      >
        <SidebarContent />
      </View>
    </View>
  )
}
