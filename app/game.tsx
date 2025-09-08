import Sidebar from '@/components/game/Sidebar/Sidebar'
import { ROUTES } from '@/constants/routes'
import { SOUNDS_URIS } from '@/constants/sound'
import { sleep } from '@/helpers/commons'
import { getBgSoundIdByQuestionStage } from '@/helpers/game'
import { useClassNameByOrientation } from '@/hooks/useClassNameByOrientation'
import { useGameStore } from '@/store/game/store'
import { AnswerOptionSerialNumber, QuestionStage } from '@/types/game'
import { useRouter } from 'expo-router'
import React, { useEffect } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

const Game = () => {
  const router = useRouter()
  const {
    currentQuestionStage,
    quiz,
    sound,
    lifelines,
    initSound,
    playSoundById,
    setGameState,
    setIsSidebarOpen,
  } = useGameStore()
  const currentQuiz = quiz[currentQuestionStage - 1]
  const [tempAnswer, setTempAnswer] = React.useState<
    AnswerOptionSerialNumber | undefined
  >()
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
    setTempAnswer(serialNumber as AnswerOptionSerialNumber)
    playSoundById(SOUNDS_URIS.finalAnswer)
    await sleep(2000)
    setShowCorrectAnswer(true)
    const isAnswerCorrect =
      serialNumber === currentQuiz.correctOptionSerialNumber
    playSoundById(
      isAnswerCorrect ? SOUNDS_URIS.correctAnswer : SOUNDS_URIS.wrongAnswer
    )
    await sleep(2000)
    if (isAnswerCorrect) {
      setIsSidebarOpen(true)
      setTempAnswer(undefined)
      setShowCorrectAnswer(false)
      await sleep(1000)

      setGameState({
        currentQuestionStage: (currentQuestionStage + 1) as QuestionStage,
      })
      await sleep(3000)

      setIsSidebarOpen(false)
      playSoundById(SOUNDS_URIS.next)

      const safeHavenSoundId = getBgSoundIdByQuestionStage(currentQuestionStage)
      console.log({ safeHavenSoundId })

      sound.apiById[SOUNDS_URIS.next].playSoundByIdOnEnd(safeHavenSoundId)
    } else {
      router.replace(ROUTES.home)
      playSoundById(SOUNDS_URIS.mainTheme)
    }
  }

  const getOptionClassNameByStatus = (
    serialNumber: AnswerOptionSerialNumber
  ) => {
    if (showCorrectAnswer) {
      const isAnswerCorrect =
        serialNumber === currentQuiz.correctOptionSerialNumber
      if (isAnswerCorrect) {
        return 'bg-green-500'
      } else if (serialNumber === tempAnswer) {
        return 'bg-red-500'
      }
    }
    return tempAnswer === serialNumber ? 'bg-tertiary' : ''
  }

  return (
    <View className='flex-1 bg-primary' key={currentQuiz.id}>
      <Sidebar />
      <View className='flex flex-col gap-lg mt-auto text-secondary'>
        <View>
          <Text className='text-secondary border-secondary border py-sm px-md rounded-lg text-center'>
            {currentQuiz.question}
          </Text>
        </View>

        <View className='flex-row flex-wrap gap-md w-full'>
          {currentQuiz.options.map((option, index) => {
            const optionClassNameByStatus = getOptionClassNameByStatus(
              (index + 1) as AnswerOptionSerialNumber
            )
            return (
              <TouchableOpacity
                key={option}
                disabled={!!tempAnswer}
                className={`${optionClassNameByOrientation} border border-secondary rounded-md px-md ${optionClassNameByStatus}`}
                onPress={() => onOptionPress(option, index + 1)}
              >
                <View className='flex-row gap-1 items-center h-[36px]'>
                  {!lifelines.fiftyFifty?.[
                    (index + 1) as AnswerOptionSerialNumber
                  ] && (
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
