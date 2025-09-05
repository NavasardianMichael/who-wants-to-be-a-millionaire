import correctAnswerSound from "@/assets/audio/correct_answer.mp3";
import finalAnswerSound from "@/assets/audio/final_answer.mp3";
import mainThemeSound from "@/assets/audio/main_theme.mp3";
import wrongAnswerSound from "@/assets/audio/wrong_answer.mp3";
import Sidebar from '@/components/game/Sidebar/Sidebar';
import { ROUTES } from '@/constants/routes';
import { sleep } from '@/helpers/commons';
import { useClassNameByOrientation } from '@/hooks/useClassNameByOrientation';
import { useGameStore } from '@/store/game/store';
import { AnswerOptionSerialNumber, QuestionStage } from '@/types/game';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Text, TouchableHighlight, View } from 'react-native';


const Game = () => {
  const router = useRouter();
  const { currentQuestionStage, quiz, initSound, playSoundById, setGameState } = useGameStore()
  const currentQuiz = quiz[currentQuestionStage - 1]
  const [tempAnswer, setTempAnswer] = React.useState<AnswerOptionSerialNumber | undefined>()
  const [showCorrectAnswer, setShowCorrectAnswer] = React.useState(false)

  const optionClassNameByOrientation = useClassNameByOrientation('w-full', 'w-[calc(50%-0.5rem)]')

  useEffect(() => {
    initSound(finalAnswerSound)
    initSound(correctAnswerSound)
    initSound(wrongAnswerSound)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onOptionPress = async (option: string, serialNumber: number) => {
    setTempAnswer(serialNumber as AnswerOptionSerialNumber)
    playSoundById(finalAnswerSound)
    await sleep(2000)
    setShowCorrectAnswer(true)
    const isAnswerCorrect = serialNumber === currentQuiz.correctOptionSerialNumber
    playSoundById(isAnswerCorrect ? correctAnswerSound : wrongAnswerSound)
    await sleep(4000)
    if (isAnswerCorrect) {
      setGameState({ currentQuestionStage: currentQuestionStage + 1 as QuestionStage })
    } else {
      router.replace(ROUTES.home);
      playSoundById(mainThemeSound)
    }
  }

  const getOptionClassNameByStatus = (serialNumber: AnswerOptionSerialNumber) => {
    if (showCorrectAnswer) {
      const isAnswerCorrect = serialNumber === currentQuiz.correctOptionSerialNumber
      if (isAnswerCorrect) {
        return 'bg-green-500'
      } else if (serialNumber === tempAnswer) {
        return 'bg-red-500'
      }
    }
    return tempAnswer === serialNumber ? 'bg-tertiary' : ''
  }

  return (
    <View className='flex-1 bg-primary'>
      <Sidebar />
      <View className='flex flex-col gap-lg mt-auto text-secondary'>
        <View>
          <Text className='text-secondary border-secondary border py-sm px-md rounded-lg text-center'>
            {currentQuiz.question}
          </Text>
        </View>

        <View className='flex-row flex-wrap gap-md w-full'>
          {
            currentQuiz.options.map((option, index) => {
              const optionClassNameByStatus = getOptionClassNameByStatus(index + 1 as AnswerOptionSerialNumber)
              return (
                <TouchableHighlight key={option} disabled={!!tempAnswer} className={`${optionClassNameByOrientation} border border-secondary rounded-md py-sm px-md ${optionClassNameByStatus}`} onPress={() => onOptionPress(option, index + 1)}>
                  <View className='flex-row gap-1'>
                    <Text className={`text-${optionClassNameByStatus ? 'secondary' : 'tertiary'} font-semibold`}>{String.fromCharCode(65 + index)}. </Text>
                    <Text className='text-secondary'>{option}</Text>
                  </View>
                </TouchableHighlight>
              )
            })
          }
        </View>
        {/* </View> */}
      </View>
    </View>
  )
}

export default Game
