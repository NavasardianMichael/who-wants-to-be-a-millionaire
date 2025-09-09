import {
  CHAR_CODES_BY_OPTION_SERIAL_NUMBER,
  OPTIONS_SERIAL_NUMBERS,
} from '@/constants/game'
import { useLifelinesStore } from '@/store/lifelines/store'
import AntDesign from '@expo/vector-icons/AntDesign'
import { memo } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

export default memo(function AskAudience() {
  const { askAudience, setLifelinesState } = useLifelinesStore()

  return (
    <View className='flex-col flex-1 justify-center p-sm mx-auto rounded-lg border border-secondary bg-[#00185f]'>
      <View className='relative flex-row grow gap'>
        {OPTIONS_SERIAL_NUMBERS.map((serialNumber) => {
          const percentage = askAudience?.[serialNumber] ?? 0
          const optionCharCode =
            CHAR_CODES_BY_OPTION_SERIAL_NUMBER[serialNumber]
          return (
            <View
              key={serialNumber}
              className={`flex flex-col justify-end items-center gap-sm grow border-separate border-l border-secondary px-md ${serialNumber === 1 ? 'border-l-0' : ''}`}
            >
              <Text className=' text-secondary'>
                {askAudience?.[serialNumber] ?? 0}%
              </Text>
              <View className={`w-xl grow mt-auto flex rounded-sm`}>
                <View
                  className='mt-auto bg-gradient-to-br from-white to-indigo-700 rounded-sm'
                  style={{ height: `${percentage}%` }}
                ></View>
              </View>
              <Text className='text-secondary'>{optionCharCode}</Text>
            </View>
          )
        })}
      </View>
      {askAudience?.[1] !== undefined && (
        <TouchableOpacity
          className={`z-10 absolute -top-4 -right-4 rounded-full bg-primary ${!askAudience ? 'opacity-50' : 'opacity-100'}`}
          onPress={() => {
            setLifelinesState({ currentLifeline: null })
          }}
          disabled={!askAudience}
        >
          <AntDesign name='closecircle' size={36} color='#fff' />
        </TouchableOpacity>
      )}
    </View>
  )
})
