import { QUESTION_STAGES_TEMPLATE } from '@/constants/game'
import { useGameStore } from '@/store/game/store'
import { Lifeline } from '@/types/game'
import Entypo from '@expo/vector-icons/Entypo'
import {
  Text,
  TouchableHighlight,
  View
} from 'react-native'
import { LIFELINES_TEMPLATE } from './lifelinesTemplate'


export default function SidebarContent() {
  const { currentQuestionStage, lifelines, setCurrentLifeline, setLifelineNonAvailable } = useGameStore()

  const onLifelinePress = (lifeline: Lifeline) => {
    setLifelineNonAvailable(lifeline)
    setCurrentLifeline(lifeline)
  }

  return (
    <>
      <View className='flex-row gap-sm'>
        {
          LIFELINES_TEMPLATE.map(({ id, icon }) => {
            return (
              <TouchableHighlight
                key={id}
                className={`relative flex justify-center items-center border border-secondary w-12 h-12 rounded-full `}
                onPress={() => onLifelinePress(id)}
              >
                <View>
                  {icon}
                  {
                    !lifelines.available[id] && (
                      <Entypo name="cross" size={60} color="red" className='absolute left-[50%] top-[50%] transform -translate-x-[50%] -translate-y-[50%]' />
                    )
                  }
                </View>
              </TouchableHighlight>
            )
          })
        }
      </View>

      <View className='flex flex-col-reverse my-auto'>
        {QUESTION_STAGES_TEMPLATE.map(({ label, stage }, index) => {
          return (
            <View key={index} className={`flex-row py-[0.05rem] back ${stage === currentQuestionStage ? 'bg-[#ff7805] rounded-sm' : ''}`}>
              <Text className='text-md font-semibold text-right w-6 color-secondary'>
                {stage}.{' '}
              </Text>
              <Text className='text-tertiary w-1'>{stage < currentQuestionStage ? '◆' : ''}</Text>
              <Text className='text-md color-secondary ml-md'>{label}</Text>
            </View>
          )
        })}
      </View>
    </>
  )
}
