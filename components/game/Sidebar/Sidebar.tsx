import Octicons from '@expo/vector-icons/Octicons'
import { useState } from 'react'
import {
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native'
import SidebarContent from './SidebarContent'


export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <View className={`fixed right-0 top-0 bottom-0 z-10`}>
      <TouchableOpacity
        className='relative z-20 m-lg'
        onPress={() => setIsOpen((prev) => !prev)}
      >
        <Octicons
          name={isOpen ? 'sidebar-collapse' : 'sidebar-expand'}
          size={20}
          color={'#fff'}
        />
      </TouchableOpacity>
      {isOpen && (
        <TouchableWithoutFeedback onPress={() => setIsOpen(false)}>
          <View className='fixed left-0 top-0 bottom-0 right-0 bg-primary opacity-80' />
        </TouchableWithoutFeedback>
      )}
      <View
        className={`absolute top-0 right-0 z-10 w-80 p-md box-border transition  ${!isOpen && 'translate-x-full'} bg-gradient-to-br from-purple-700 via-purple-600 to-indigo-900 h-full flex-1`}
      >
        <SidebarContent />
      </View>
    </View>
  )
}
