import { CHAR_CODES_BY_OPTION_SERIAL_NUMBER } from '@/constants/game'
import { ICONS } from '@/constants/icons'
import { useClassNameByOrientation } from '@/hooks/useClassNameByOrientation'
import { useStyleByOrientation } from '@/hooks/useStyleByOrientation'
import { useLifelinesStore } from '@/store/lifelines/store'
import AntDesign from '@expo/vector-icons/AntDesign'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Text, TouchableOpacity, View } from 'react-native'

export default memo(function PhoneAFriend() {
  const { phoneAFriend, setLifelinesState } = useLifelinesStore()
  const { t } = useTranslation()

  const style = useStyleByOrientation(
    { width: 160, height: 160 },
    { width: 90, height: 90 }
  )
  const className = useClassNameByOrientation('mb-8', 'mb-2')

  return (
    <View className='mx-auto relative max-w-52'>
      <ICONS.phone style={style} className={`mx-auto ${className} w-8 h-8`} />
      {phoneAFriend?.suggestedOptionSerialNumber ? (
        <Text className='text-center text-secondary text-lg'>
          I think the answer is{' '}
          <Text className='font-bold'>
            {
              CHAR_CODES_BY_OPTION_SERIAL_NUMBER[
                phoneAFriend.suggestedOptionSerialNumber
              ]
            }
          </Text>
        </Text>
      ) : (
        <View className='flex flex-col gap-sm items-center'>
          <Text className='text-secondary font-semibold text-center'>
            {t('please-wait')}
          </Text>
          <Text className='text-secondary font-semibold text-center'>
            {t('we-are-getting-in-with-your-friend')}
          </Text>
        </View>
      )}
      {phoneAFriend && (
        <TouchableOpacity
          className={`z-10 absolute -top-4 -right-4 rounded-full bg-primary ${!phoneAFriend ? 'opacity-50' : 'opacity-100'}`}
          onPress={() => {
            setLifelinesState({ currentLifeline: null })
          }}
        >
          <AntDesign name='closecircle' size={36} color='#fff' />
        </TouchableOpacity>
      )}
    </View>
  )
})
