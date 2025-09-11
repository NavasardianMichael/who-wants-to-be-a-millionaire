import { LIFELINES, QUESTION_STAGES_TEMPLATE } from '@/constants/game'
import { SOUND_ID_BY_LIFELINE } from '@/constants/sound'
import { sleep } from '@/helpers/commons'
import { useCurrentQuizItem } from '@/hooks/useCurrentQuizItem'
import { useSound } from '@/hooks/useSound'
import { useGameStore } from '@/store/game/store'
import { useLifelinesStore } from '@/store/lifelines/store'
import { useSoundStore } from '@/store/sound/store'
import { Lifeline, OptionSerialNumber } from '@/types/game'
import Entypo from '@expo/vector-icons/Entypo'
import { useMemo } from 'react'
import { Text, TouchableHighlight, View } from 'react-native'
import { LIFELINES_TEMPLATE } from './lifelinesTemplate'

export default function SidebarContent() {
  const { currentQuestionStage, setIsSidebarOpen } = useGameStore()
  const { soundAPIById, playSoundById } = useSoundStore()
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

  useSound(SOUND_ID_BY_LIFELINE.fiftyFifty)
  useSound(SOUND_ID_BY_LIFELINE.askAudience)
  useSound(SOUND_ID_BY_LIFELINE.phoneAFriend)

  const isAnswerPending = useMemo(() => {
    return !currentQuizItem || !!currentQuizItem.answeredOptionSerialNumber
  }, [currentQuizItem])

  const lifelineActions: Record<
    Lifeline,
    (correctOptionSerialNumber: OptionSerialNumber) => void
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
    setLifelinesState({ currentLifeline: lifeline })

    const lifelineSoundId = SOUND_ID_BY_LIFELINE[lifeline]
    setLifelinesState({ lifelinesDisabled: true })
    setIsSidebarOpen(false)
    playSoundById(lifelineSoundId)
    const isShowingResultAfterSoundEnds =
      lifeline === LIFELINES.askAudience || lifeline === LIFELINES.phoneAFriend
    if (!isShowingResultAfterSoundEnds) {
      await sleep(800)
      lifelineActions[lifeline](currentQuizItem.correctOptionSerialNumber)
    }

    soundAPIById[lifelineSoundId].onEnd(() => {
      setLifelinesState({ lifelinesDisabled: false })
      if (isShowingResultAfterSoundEnds)
        lifelineActions[lifeline](currentQuizItem.correctOptionSerialNumber)
      // setCurrentLifeline(null)
    })
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
              <View>
                {icon}
                {lifelinesStore[id] && (
                  <Entypo
                    name='cross'
                    size={60}
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
        {QUESTION_STAGES_TEMPLATE.map(({ label, stage }, index) => {
          return (
            <View
              key={index}
              className={`flex-row py-[0.05rem] back ${stage === currentQuestionStage ? 'bg-[#ff7805] rounded-sm' : ''}`}
            >
              <>
                <Text className='transition text-md font-semibold text-right w-6 color-secondary'>
                  {stage}.{' '}
                </Text>
                <Text className='text-tertiary w-1'>
                  {stage < currentQuestionStage ? '◆' : ''}
                </Text>
                <Text className='text-md color-secondary ml-md'>{label}</Text>
              </>
            </View>
          )
        })}
      </View>
    </>
  )
}
