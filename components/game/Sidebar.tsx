import Octicons from '@expo/vector-icons/Octicons';
import { useState } from 'react';

import { TouchableOpacity, View } from 'react-native';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View className='fixed right-0 top-0 bottom-0  text-secondary'>
      <TouchableOpacity onPress={() => setIsOpen(prev => !prev)}>
        <Octicons name={isOpen ? "sidebar-collapse" : "sidebar-expand"} size={24} color="#fff" />
      </TouchableOpacity>
      <View className={`absolute z-10 w-80 p-lg transition-transform ${isOpen && 'transform translate-x-0'}`}>
        Menu Content
      </View>
    </View>
  )
}
