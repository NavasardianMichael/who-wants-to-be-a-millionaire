import finalAnswerSound from "@/assets/audio/final_answer.mp3"
import CountDown from '@/components/game/CountDown'
import Sidebar from '@/components/game/Sidebar/Sidebar'
import { useGameStore } from '@/store/game/store'
import React, { useEffect } from 'react'
import { Text, TouchableHighlight, View } from 'react-native'


const Game = () => {
  const { currentQuestionStage, quiz, initSound, playSoundById } = useGameStore()
  const currentQuiz = quiz[currentQuestionStage - 1]

  useEffect(() => {
    initSound(finalAnswerSound)
  }, [initSound])

  const onOptionPress = async (option: string, index: number) => {
    playSoundById(finalAnswerSound)
  }

  return (
    <View className='flex-1 bg-primary'>
      <View className='flex items-center justify-center my-auto'>
        <CountDown />
      </View>
      <Sidebar />
      <View className='flex flex-col gap-4 mt-auto text-secondary'>
        <View>
          <Text className='text-secondary border-secondary border py-sm px-md rounded-lg text-center'>
            {currentQuiz.question}
          </Text>
        </View>

        <View className='flex-row flex-wrap gap-sm w-full'>
          {
            currentQuiz.options.map((option, index) => {
              return (
                <TouchableHighlight key={option} className='w-[calc(50%-0.25rem)] border border-secondary rounded-md py-sm px-md' onPress={() => onOptionPress(option, index)}>
                  <View className='flex-row gap-1'>
                    <Text className='color-tertiary font-semibold'>{String.fromCharCode(65 + index)}. </Text>
                    <Text className='text-secondary'>{option}</Text>
                  </View>
                </TouchableHighlight>
              )
            }
            )
          }
        </View>
        {/* </View> */}
      </View>
    </View>
  )
}

export default Game
