import Feather from '@expo/vector-icons/Feather'
import Octicons from '@expo/vector-icons/Octicons'
import { useState } from 'react'

import { TouchableOpacity, View } from 'react-native'

export default function Sidebar() {
  // const { lifelines } = useGameStore()
  const [isOpen, setIsOpen] = useState(false)
  // console.log({ lifelines })

  return (
    <View className={`fixed right-0 top-0 bottom-0`}>
      <TouchableOpacity
        className='relative z-20 m-md'
        onPress={() => setIsOpen((prev) => !prev)}
      >
        <Octicons
          name={isOpen ? 'sidebar-collapse' : 'sidebar-expand'}
          size={24}
          color={'#fff'}
        />
      </TouchableOpacity>
      <View
        className={`absolute top-0 right-0 z-10 w-80 p-md box-border transition  ${!isOpen && 'translate-x-full'} bg-gradient-to-br from-purple-700 via-purple-600 to-indigo-900 h-full flex-1`}
      >
        <View className='flex-row gap-md'>
          <TouchableOpacity
            className='flex align-center border border-secondary p-sm w-fit aspect-square rounded-full'
            // onPress={() => setIsOpen((prev) => !prev)}
          >
            <Feather name='phone-call' size={16} color='#fff' />
          </TouchableOpacity>
          <TouchableOpacity
            className='flex align-center border border-secondary p-sm w-fit aspect-square rounded-full'
            // onPress={() => setIsOpen((prev) => !prev)}
          >
            <Feather name='phone-call' size={16} color='#fff' />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}
