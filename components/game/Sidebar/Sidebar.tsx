import { useGameStore } from '@/store/game/store'
import Octicons from '@expo/vector-icons/Octicons'
import { Pressable, TouchableOpacity, View } from 'react-native'
import SidebarContent from './SidebarContent'

export default function Sidebar() {
  const { isSidebarOpen, setIsSidebarOpen } = useGameStore()

  return (
    <View className={`fixed right-0 top-0 bottom-0 z-10`}>
      <TouchableOpacity
        className='relative z-20 m-lg'
        onPress={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        <Octicons
          name={isSidebarOpen ? 'sidebar-collapse' : 'sidebar-expand'}
          size={20}
          color={'#fff'}
        />
      </TouchableOpacity>
      {isSidebarOpen && (
        <Pressable onPress={() => setIsSidebarOpen(false)}>
          <View className='fixed left-0 top-0 bottom-0 right-0 bg-primary opacity-80' />
        </Pressable>
      )}
      <View
        className={`absolute top-0 right-0 z-10 w-80 p-md box-border transition  ${!isSidebarOpen && 'translate-x-full'} bg-gradient-to-br from-indigo-900  to-indigo-700 border-l border-l-secondary h-full flex-1`}
      >
        <SidebarContent />
      </View>
    </View>
  )
}
