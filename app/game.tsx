import Sidebar from '@/components/game/Sidebar/Sidebar'
import { ROUTES } from '@/constants/routes'
import { SOUND_DURATION_BY_URI, SOUNDS_URIS } from '@/constants/sound'
import { sleep } from '@/helpers/commons'
import { getBgSoundIdByQuestionStage } from '@/helpers/game'
import { useClassNameByOrientation } from '@/hooks/useClassNameByOrientation'
import { useCurrentQuizItem } from '@/hooks/useCurrentQuizItem'
import { useSound } from '@/hooks/useSound'
import { setLastQuestionNumberBySafeHavenNumberByLanguage } from '@/services/localStorage/api'
import { useGameStore } from '@/store/game/store'
import { useLifelinesStore } from '@/store/lifelines/store'
import { useSettingsStore } from '@/store/settings/store'
import { useSoundStore } from '@/store/sound/store'
import { OptionSerialNumber, QuestionStage } from '@/types/game'
import { useRouter } from 'expo-router'
import React, { useEffect } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

const Game = () => {
  const router = useRouter()
  const {
    currentQuestionStage,
    setGameState,
    setIsSidebarOpen,
    setAnsweredOptionSerialNumber,
  } = useGameStore()
  const { soundAPIById, playSoundById } = useSoundStore()
  const { setLifelinesState, currentLifeline, fiftyFifty } = useLifelinesStore()
  const { language } = useSettingsStore()

  useSound(SOUNDS_URIS.resign)
  useSound(SOUNDS_URIS.finalAnswer)
  useSound(SOUNDS_URIS.correctAnswer)
  useSound(SOUNDS_URIS.wrongAnswer)
  useSound(SOUNDS_URIS.next)
  useSound(SOUNDS_URIS.easy, { loop: true })
  useSound(SOUNDS_URIS.medium, { loop: true })
  useSound(SOUNDS_URIS.hard, { loop: true })

  const currentQuizItem = useCurrentQuizItem()

  const [showCorrectAnswer, setShowCorrectAnswer] = React.useState(false)

  const optionClassNameByOrientation = useClassNameByOrientation(
    'w-full',
    'w-[calc(50%-0.5rem)]'
  )

  useEffect(() => {
    return () => {
      setGameState({
        currentQuestionStage: 1,
        isSidebarOpen: false,
        quiz: [],
      })
      setLifelinesState({
        currentLifeline: null,
        askAudience: null,
        phoneAFriend: null,
        fiftyFifty: null,
        switchQuestion: null,
        lifelinesPending: false,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundAPIById[SOUNDS_URIS.resign]])

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
    console.log({ currentQuizItem })

    const asyncStorageSetPayload = {
      language,
      quizItemId: currentQuizItem.id,
    }

    if (isAnswerCorrect) {
      setIsSidebarOpen(true)
      setShowCorrectAnswer(false)
      await sleep(1000)

      setGameState({
        currentQuestionStage: (currentQuestionStage + 1) as QuestionStage,
      })

      setLifelinesState({ currentLifeline: null })
      await sleep(3000)

      setIsSidebarOpen(false)
      setAnsweredOptionSerialNumber(null)
      playSoundById(SOUNDS_URIS.next)
      await sleep(SOUND_DURATION_BY_URI[SOUNDS_URIS.next])
      const safeHavenSoundId = getBgSoundIdByQuestionStage(currentQuestionStage)
      console.log({ safeHavenSoundId })
      playSoundById(safeHavenSoundId)
      setLastQuestionNumberBySafeHavenNumberByLanguage(asyncStorageSetPayload)
    } else {
      playSoundById(SOUNDS_URIS.mainTheme)
      setLifelinesState({ currentLifeline: null })
      setLastQuestionNumberBySafeHavenNumberByLanguage(asyncStorageSetPayload)
      router.replace(ROUTES.home)
    }
  }

  const getOptionClassNameByStatus = (serialNumber: OptionSerialNumber) => {
    if (showCorrectAnswer) {
      const isAnswerCorrect =
        serialNumber === currentQuizItem.correctOptionSerialNumber
      if (isAnswerCorrect) {
        return 'bg-green-500'
      } else if (serialNumber === currentQuizItem.answeredOptionSerialNumber) {
        return 'bg-red-500'
      }
    }
    return currentQuizItem.answeredOptionSerialNumber === serialNumber
      ? 'bg-tertiary'
      : ''
  }

  if (!currentQuizItem) return null

  return (
    <View className='mt-auto bg-primary' key={currentQuizItem.id}>
      <Sidebar />
      {currentQuizItem ? (
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
              const isRemovedByFiftyFifty =
                !!currentLifeline &&
                fiftyFifty?.[(index + 1) as OptionSerialNumber]
              return (
                <TouchableOpacity
                  key={option}
                  disabled={
                    !!currentQuizItem.answeredOptionSerialNumber ||
                    isRemovedByFiftyFifty
                  }
                  className={`${optionClassNameByOrientation} border border-secondary rounded-md px-md ${optionClassNameByStatus}`}
                  onPress={() => onOptionPress(option, index + 1)}
                >
                  <View className='flex-row gap-1 items-center h-[30px]'>
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
        </View>
      ) : (
        <Text>Loading...</Text>
      )}
    </View>
  )
}

export default Game
