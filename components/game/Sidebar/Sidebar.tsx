import { useGameStore } from '@/store/game/store'
import { Image, Pressable, TouchableOpacity, View } from 'react-native'
import SidebarContent from './SidebarContent'

export default function Sidebar() {
  const { isSidebarOpen, setIsSidebarOpen } = useGameStore()

  return (
    <View className={`fixed right-0 top-0 bottom-0 z-10`}>
      <TouchableOpacity
        className='relative h-[20px] z-20 m-lg'
        onPress={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        <Image
          source={require('../../../assets/icons/sidebar.svg')}
          className={`h-full! ${isSidebarOpen ? 'rotate-180' : ''}`}
        />
      </TouchableOpacity>
      {isSidebarOpen && (
        <Pressable onPress={() => setIsSidebarOpen(false)}>
          <View className='fixed left-0 top-0 bottom-0 right-0 bg-primary opacity-80' />
        </Pressable>
      )}
      <View
        className={`absolute top-0 right-0 z-10 w-80 p-md py-[12px] box-border transition  ${!isSidebarOpen && 'translate-x-full'} bg-gradient-to-br from-indigo-900  to-indigo-700 border-l border-l-secondary h-full flex-1`}
      >
        <SidebarContent />
      </View>
    </View>
  )
}
