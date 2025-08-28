import CountDown from '@/components/game/CountDown'
import React from 'react'
import { Text, TouchableHighlight, View } from 'react-native'

const Game = () => {
  return (
    <View className='flex-1 bg-primary'>
      <CountDown />
      <View className='flex flex-col gap-4 mt-auto text-secondary'>
        <View>
          <Text className='text-secondary border-secondary border py-sm px-md rounded-lg text-center'>Lorem ipsum dolor sit amet consectetur adipisicing elit. Reprehenderit, est.?</Text>
        </View>

        <View className='flex flex-col gap-2'>
          <View className='flex-row gap-2'>
            <TouchableHighlight className='flex-1 border border-secondary rounded-md py-sm px-md'>
              <View className='flex-row gap-1'>
                <Text className='text-[#cc9f31] font-semibold'>A. </Text>
                <Text className='text-secondary'>Answer 1</Text>
              </View>
            </TouchableHighlight>
            <TouchableHighlight className='flex-1 border border-secondary rounded-md py-sm px-md'>
              <View className='flex-row gap-1'>
                <Text className='text-[#cc9f31] font-semibold'>B. </Text>
                <Text className='text-secondary'>Answer 2</Text>
              </View>
            </TouchableHighlight>
          </View>
          <View className='flex-row gap-2'>
            <TouchableHighlight className='flex-1 border border-secondary rounded-md py-sm px-md'>
              <View className='flex-row gap-1'>
                <Text className='text-[#cc9f31] font-semibold'>C. </Text>
                <Text className='text-secondary'>Answer 3</Text>
              </View>
            </TouchableHighlight>
            <TouchableHighlight className='flex-1 border border-secondary rounded-md py-sm px-md'>
              <View className='flex-row gap-1'>
                <Text className='text-[#cc9f31] font-semibold'>D. </Text>
                <Text className='text-secondary'>Answer 4</Text>
              </View>
            </TouchableHighlight>
          </View>
        </View>
      </View>
    </View>
  )
}

export default Game
