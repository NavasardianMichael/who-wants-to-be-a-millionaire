import { QUESTION_STAGES_TEMPLATE } from '@/constants/game'
import { useGameStore } from '@/store/game/store'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import Octicons from '@expo/vector-icons/Octicons'
import { useState } from 'react'
import {
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native'

export default function Sidebar() {
  const { currentQuestionStage } = useGameStore()
  // const { lifelines } = useGameStore()
  const [isOpen, setIsOpen] = useState(false)
  // console.log({ lifelines })

  return (
    <View className={`fixed right-0 top-0 bottom-0 z-10`}>
      <TouchableOpacity
        className='relative z-20 m-md'
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
        <View className='flex-row gap-sm'>
          <TouchableOpacity
            className='flex justify-center items-center border border-secondary w-12 h-12 rounded-full '
            // onPress={() => setIsOpen((prev) => !prev)}
          >
            <Text className='text-[.65rem] text-secondary font-bold'>
              50/50
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className='flex justify-center items-center border border-secondary w-12 h-12 rounded-full'
            // onPress={() => setIsOpen((prev) => !prev)}
          >
            <FontAwesome name='phone' size={16} color='#fff' />
          </TouchableOpacity>
          <TouchableOpacity
            className='flex justify-center items-center border border-secondary w-12 h-12 rounded-full'
            // onPress={() => setIsOpen((prev) => !prev)}
          >
            <FontAwesome5 name='users' size={16} color='#fff' />
          </TouchableOpacity>
          <TouchableOpacity
            className='flex justify-center items-center border border-secondary w-12 h-12 rounded-full'
            // onPress={() => setIsOpen((prev) => !prev)}
          >
            <FontAwesome name='refresh' size={16} color='#fff' />
          </TouchableOpacity>
        </View>

        <View className='flex flex-col-reverse my-auto'>
          {QUESTION_STAGES_TEMPLATE.map(({ label, stage }, index) => {
            return (
              <View key={index} className='flex-row gap-md py-[0.05rem]'>
                <Text className='text-xs text-right w-8 color-secondary'>
                  {stage}.{' '}
                  {stage === currentQuestionStage && (
                    <Text className='text-tertiary'>◆</Text>
                  )}
                </Text>
                <Text className='text-xs color-secondary'>{label}</Text>
              </View>
            )
          })}
        </View>
      </View>
    </View>
  )
}
