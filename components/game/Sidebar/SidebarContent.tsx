import { LIFELINES, QUESTION_STAGES } from '@/constants/game'
import { SOUND_DURATION_BY_URI, SOUND_ID_BY_LIFELINE } from '@/constants/sound'
import { sleep } from '@/helpers/commons'
import { getBgSoundIdByQuestionStage } from '@/helpers/game'
import { useCurrentQuizItem } from '@/hooks/useCurrentQuizItem'
import { useSound } from '@/hooks/useSound'
import { useGameStore } from '@/store/game/store'
import { useLifelinesStore } from '@/store/lifelines/store'
import { SingleLifelineActionPayload } from '@/store/lifelines/types'
import { useSoundStore } from '@/store/sound/store'
import { Lifeline } from '@/types/game'
import Entypo from '@expo/vector-icons/Entypo'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Text, TouchableHighlight, View } from 'react-native'
import { LIFELINES_TEMPLATE } from './lifelinesTemplate'

export default function SidebarContent() {
  const { currentQuestionStage, setIsSidebarOpen } = useGameStore()
  const { playSoundById } = useSoundStore()
  const lifelinesStore = useLifelinesStore()
  const {
    lifelinesDisabled,
    setFiftyFiftyLifeline,
    setAskAudienceLifeline,
    setPhoneAFriendLifeline,
    setSwitchQuestionLifeline,
    setLifelinesState,
  } = lifelinesStore

  const currentQuizItem = useCurrentQuizItem()
  const { t } = useTranslation()

  useSound(SOUND_ID_BY_LIFELINE.fiftyFifty)
  useSound(SOUND_ID_BY_LIFELINE.askAudience)
  useSound(SOUND_ID_BY_LIFELINE.phoneAFriend)

  const isAnswerPending = useMemo(() => {
    return !currentQuizItem || !!currentQuizItem.answeredOptionSerialNumber
  }, [currentQuizItem])

  const lifelineActions: Record<
    Lifeline,
    (payload: SingleLifelineActionPayload) => void
  > = useMemo(() => {
    return {
      fiftyFifty: setFiftyFiftyLifeline,
      askAudience: setAskAudienceLifeline,
      phoneAFriend: setPhoneAFriendLifeline,
      switchQuestion: setSwitchQuestionLifeline,
    }
  }, [
    setAskAudienceLifeline,
    setFiftyFiftyLifeline,
    setPhoneAFriendLifeline,
    setSwitchQuestionLifeline,
  ])

  const onLifelinePress = async (lifeline: Lifeline) => {
    setLifelinesState({ currentLifeline: lifeline, lifelinesDisabled: true })
    const lifelineSoundId = SOUND_ID_BY_LIFELINE[lifeline]

    setIsSidebarOpen(false)
    playSoundById(lifelineSoundId)
    if (lifeline === LIFELINES.fiftyFifty) {
      await sleep(800) // to make it feel snappier
    } else {
      await sleep(SOUND_DURATION_BY_URI[lifelineSoundId])
    }

    lifelineActions[lifeline]({
      correctOptionSerialNumber: currentQuizItem.correctOptionSerialNumber,
      currentQuestionStage,
    })

    await sleep(3000)
    const safeHavenSoundId = getBgSoundIdByQuestionStage(currentQuestionStage)
    playSoundById(safeHavenSoundId)
    setLifelinesState({ lifelinesDisabled: false })
  }

  return (
    <>
      <View className='flex-row gap-sm'>
        {LIFELINES_TEMPLATE.map(({ id, icon }) => {
          const isDisabled =
            isAnswerPending || lifelinesDisabled || !!lifelinesStore[id]

          return (
            <TouchableHighlight
              key={id}
              className={`relative flex justify-center items-center border border-secondary w-12 h-12 rounded-full ${isDisabled ? 'opacity-50' : 'opacity-100'}`}
              disabled={isDisabled}
              onPress={() => onLifelinePress(id)}
            >
              <View className='h-[36px] flex justify-center items-center'>
                {icon}
                {lifelinesStore[id] && (
                  <Entypo
                    name='cross'
                    size={36}
                    color='red'
                    className='absolute left-[50%] top-[50%] transform -translate-x-[50%] -translate-y-[50%]'
                  />
                )}
              </View>
            </TouchableHighlight>
          )
        })}
      </View>

      <View className='flex flex-col-reverse my-auto'>
        {QUESTION_STAGES.map((stage) => {
          return (
            <View
              key={stage}
              className={`flex-row py-[0.05rem] back ${stage === currentQuestionStage ? 'bg-[#ff7805] rounded-sm' : ''}`}
            >
              <>
                <Text className='transition text-md font-semibold text-right w-6 color-secondary'>
                  {stage}.{' '}
                </Text>
                <Text className='text-tertiary w-1'>
                  {stage < currentQuestionStage ? '◆' : ''}
                </Text>
                <Text className='text-md color-secondary ml-md'>
                  {t(`currency-symbol`)}
                  {t(`stage-${stage}-money-amount`)}
                </Text>
              </>
            </View>
          )
        })}
      </View>
    </>
  )
}
