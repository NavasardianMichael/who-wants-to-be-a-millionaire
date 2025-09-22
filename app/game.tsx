import { ICONS } from '@/constants/icons'
import { ROUTES } from '@/constants/routes'
import { SOUND_DURATION_BY_URI, SOUNDS_URIS } from '@/constants/sound'
import { sleep } from '@/helpers/commons'
import { getBgSoundIdByQuestionStage } from '@/helpers/game'
import { useClassNameByOrientation } from '@/hooks/useClassNameByOrientation'
import { useCurrentQuizItem } from '@/hooks/useCurrentQuizItem'
import { useSound } from '@/hooks/useSound'
import { useStyleByOrientation } from '@/hooks/useStyleByOrientation'
import { setLastQuestionNumberBySafeHavenNumberByLanguage } from '@/services/localStorage/api'
import { useGameStore } from '@/store/game/store'
import { useLifelinesStore } from '@/store/lifelines/store'
import { useSettingsStore } from '@/store/settings/store'
import { useSoundStore } from '@/store/sound/store'
import { OptionSerialNumber, QuestionStage } from '@/types/game'
import { useRouter } from 'expo-router'
import React, { Fragment, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  StyleProp,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native'

const Game = () => {
  const router = useRouter()
  const {
    currentQuestionStage,
    setGameState,
    setIsSidebarOpen,
    setAnsweredOptionSerialNumber,
    initNewQuizItemByLanguageAndSafeHavenNumber,
  } = useGameStore()
  const { soundAPIById, playSoundById } = useSoundStore()
  const {
    setLifelinesState,
    currentLifeline,
    fiftyFifty,
    switchQuestion,
    setSwitchQuestionLifeline,
  } = useLifelinesStore()
  const { language } = useSettingsStore()
  const { t } = useTranslation()

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

  const optionClassNameByOrientation = useClassNameByOrientation('w-full', '')
  const optionStyleByOrientation = useStyleByOrientation(
    {
      width: '100%',
    },
    {
      width: '48%',
    },
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
    const isSwitchQuestionMode = switchQuestion?.waitingToSwitchQuizItem
    if (isSwitchQuestionMode) {
      setSwitchQuestionLifeline({
        wouldAnswer: serialNumber as OptionSerialNumber,
      })
    }

    setAnsweredOptionSerialNumber(serialNumber as OptionSerialNumber)
    if (!isSwitchQuestionMode) {
      playSoundById(SOUNDS_URIS.finalAnswer)
    }
    await sleep(2000)
    setShowCorrectAnswer(true)
    const isAnswerCorrect =
      serialNumber === currentQuizItem.correctOptionSerialNumber
    if (!isSwitchQuestionMode) {
      playSoundById(
        isAnswerCorrect ? SOUNDS_URIS.correctAnswer : SOUNDS_URIS.wrongAnswer,
      )
    }
    await sleep(2000)

    const asyncStorageSetPayload = {
      language,
      quizItemId: currentQuizItem.id,
    }

    if (isAnswerCorrect) {
      if (!isSwitchQuestionMode) setIsSidebarOpen(true)
      setShowCorrectAnswer(false)
      await sleep(1000)

      if (!isSwitchQuestionMode) {
        setGameState({
          currentQuestionStage: (currentQuestionStage + 1) as QuestionStage,
        })
      }

      setLifelinesState({ currentLifeline: null })
      await sleep(3000)

      setAnsweredOptionSerialNumber(null)
      if (!isSwitchQuestionMode) {
        setIsSidebarOpen(false)
        playSoundById(SOUNDS_URIS.next)
        await sleep(SOUND_DURATION_BY_URI[SOUNDS_URIS.next])
        const safeHavenSoundId =
          getBgSoundIdByQuestionStage(currentQuestionStage)
        playSoundById(safeHavenSoundId)
      }
      setLastQuestionNumberBySafeHavenNumberByLanguage(asyncStorageSetPayload)
    } else {
      setLastQuestionNumberBySafeHavenNumberByLanguage(asyncStorageSetPayload)
      setLifelinesState({ currentLifeline: null })
      if (!isSwitchQuestionMode) {
        playSoundById(SOUNDS_URIS.mainTheme)
        router.replace(ROUTES.home)
      }
    }

    if (isSwitchQuestionMode) {
      initNewQuizItemByLanguageAndSafeHavenNumber({
        language,
        quizItemId: currentQuizItem.id,
      })
      setSwitchQuestionLifeline({ waitingToSwitchQuizItem: false })
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
    <Fragment key={currentQuizItem.id}>
      {switchQuestion?.waitingToSwitchQuizItem && (
        <Text className='text-secondary text-center mt-auto font-semibold'>
          {t('which-option-do-you-think-is-correct')}
        </Text>
      )}
      <View className='mt-auto bg-primary' key={currentQuizItem.id}>
        {currentQuizItem ? (
          <View className='flex flex-col gap-lg mt-auto text-secondary'>
            <View>
              <Text className='text-secondary border-secondary border py-sm px-md rounded-lg text-center'>
                {currentQuizItem.question}
              </Text>
            </View>
            <View className='flex-row flex-wrap gap-md w-full relative'>
              {currentQuizItem.options.map((option, index) => {
                const optionClassNameByStatus = getOptionClassNameByStatus(
                  (index + 1) as OptionSerialNumber,
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
                    style={optionStyleByOrientation as StyleProp<ViewStyle>}
                    className={`${optionClassNameByOrientation} grow border border-secondary rounded-md px-md ${optionClassNameByStatus}`}
                    onPress={() => onOptionPress(option, index + 1)}
                  >
                    <View className='flex-row gap-1 items-center h-8'>
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

              {
                <View
                  className={`absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 ${!switchQuestion?.waitingToSwitchQuizItem && 'scale-0'} transition-transform duration-300 bg-secondary rounded-full p-sm border border-primary`}
                >
                  <ICONS.switchDark />
                </View>
              }
            </View>
          </View>
        ) : (
          <Text>Loading...</Text>
        )}
      </View>
    </Fragment>
  )
}

export default Game
