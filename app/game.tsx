import Sidebar from '@/components/game/Sidebar/Sidebar'
import { ROUTES } from '@/constants/routes'
import { SOUNDS_URIS } from '@/constants/sound'
import { sleep } from '@/helpers/commons'
import { getBgSoundIdByQuestionStage } from '@/helpers/game'
import { useClassNameByOrientation } from '@/hooks/useClassNameByOrientation'
import { useCurrentQuizItem } from '@/hooks/useCurrentQuizItem'
import { useGameStore } from '@/store/game/store'
import { OptionSerialNumber, QuestionStage } from '@/types/game'
import { useRouter } from 'expo-router'
import React, { useEffect } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

const Game = () => {
  const router = useRouter()
  const {
    currentQuestionStage,
    sound,
    lifelines,
    initSound,
    playSoundById,
    setGameState,
    setIsSidebarOpen,
    setAnsweredOptionSerialNumber,
    setCurrentLifeline
  } = useGameStore()
  const currentQuizItem = useCurrentQuizItem()
  const [showCorrectAnswer, setShowCorrectAnswer] = React.useState(false)

  const optionClassNameByOrientation = useClassNameByOrientation(
    'w-full',
    'w-[calc(50%-0.5rem)]'
  )

  useEffect(() => {
    initSound(SOUNDS_URIS.finalAnswer)
    initSound(SOUNDS_URIS.correctAnswer)
    initSound(SOUNDS_URIS.wrongAnswer)
    initSound(SOUNDS_URIS.next)
    initSound(SOUNDS_URIS.easy, { loop: true })
    initSound(SOUNDS_URIS.medium, { loop: true })
    initSound(SOUNDS_URIS.hard, { loop: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onOptionPress = async (option: string, serialNumber: number) => {
    setAnsweredOptionSerialNumber(serialNumber as OptionSerialNumber)
    playSoundById(SOUNDS_URIS.finalAnswer)
    await sleep(2000)
    setShowCorrectAnswer(true)
    const isAnswerCorrect =
      serialNumber === currentQuizItem.correctOptionSerialNumber
    playSoundById(
      isAnswerCorrect ? SOUNDS_URIS.correctAnswer : SOUNDS_URIS.wrongAnswer
    )
    await sleep(2000)
    if (isAnswerCorrect) {
      setIsSidebarOpen(true)
      setShowCorrectAnswer(false)
      await sleep(1000)

      setGameState({
        currentQuestionStage: (currentQuestionStage + 1) as QuestionStage,
      })
      await sleep(3000)

      setIsSidebarOpen(false)
      setAnsweredOptionSerialNumber(null)
      playSoundById(SOUNDS_URIS.next)

      const safeHavenSoundId = getBgSoundIdByQuestionStage(currentQuestionStage)
      sound.apiById[SOUNDS_URIS.next].playSoundByIdOnEnd(safeHavenSoundId)
    } else {
      router.replace(ROUTES.home)
      playSoundById(SOUNDS_URIS.mainTheme)
    }
    setCurrentLifeline(null)
  }

  const getOptionClassNameByStatus = (
    serialNumber: OptionSerialNumber
  ) => {
    if (showCorrectAnswer) {
      const isAnswerCorrect =
        serialNumber === currentQuizItem.correctOptionSerialNumber
      if (isAnswerCorrect) {
        return 'bg-green-500'
      } else if (serialNumber === currentQuizItem.answeredOptionSerialNumber) {
        return 'bg-red-500'
      }
    }
    return currentQuizItem.answeredOptionSerialNumber === serialNumber ? 'bg-tertiary' : ''
  }

  return (
    <View className='flex-1 bg-primary' key={currentQuizItem.id}>
      <Sidebar />
      <View className='flex flex-col gap-lg mt-auto text-secondary'>
        <View>
          <Text className='text-secondary border-secondary border py-sm px-md rounded-lg text-center'>
            {currentQuizItem.question}
          </Text>
        </View>

        <View className='flex-row flex-wrap gap-md w-full'>
          {currentQuizItem.options.map((option, index) => {
            const optionClassNameByStatus = getOptionClassNameByStatus(
              (index + 1) as OptionSerialNumber
            )
            const isRemovedByFiftyFifty = lifelines.fiftyFifty?.[
              (index + 1) as OptionSerialNumber
            ]
            return (
              <TouchableOpacity
                key={option}
                disabled={!!currentQuizItem.answeredOptionSerialNumber || isRemovedByFiftyFifty}
                className={`${optionClassNameByOrientation} border border-secondary rounded-md px-md ${optionClassNameByStatus}`}
                onPress={() => onOptionPress(option, index + 1)}
              >
                <View className='flex-row gap-1 items-center h-[36px]'>
                  {!isRemovedByFiftyFifty && (
                    <>
                      <Text
                        className={`text-${optionClassNameByStatus ? 'secondary' : 'tertiary'} font-semibold`}
                      >
                        {String.fromCharCode(65 + index)}.{' '}
                      </Text>
                      <Text className='text-secondary'>{option}</Text>
                    </>
                  )}
                </View>
              </TouchableOpacity>
            )
          })}
        </View>
        {/* </View> */}
      </View>
    </View>
  )
}

export default Game
