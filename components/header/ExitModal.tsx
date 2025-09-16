import { ROUTES } from '@/constants/routes'
import { usePathname, useRouter } from 'expo-router'
import { FC, memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal, Text, TouchableOpacity, View } from 'react-native'

type Props = {
  isVisible: boolean
  onClose: () => void
}

const ExitModal: FC<Props> = ({ isVisible, onClose }) => {
  const pathName = usePathname()
  const router = useRouter()
  const { t } = useTranslation()

  if (pathName !== ROUTES.game) return null

  return (
    <Modal
      animationType='fade'
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View className='flex-1 justify-center items-center bg-black/50'>
        <View className='bg-secondary rounded-md p-md w-10/12 max-w-sm'>
          <View className='mb-4'>
            <Text className='font-semibold text-primary'>
              {t('are-you-sure-you-want-to-quit')}
            </Text>
          </View>
          <View className='flex-row justify-end'>
            <TouchableOpacity onPress={onClose} className='px-4 py-2'>
              <Text className='text-primary font-semibold'>{t('no')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                onClose()
                router.replace(ROUTES.home)
              }}
              className='px-4 py-2'
            >
              <Text className='font-semibold text-red-500'>{t('yes')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

export default memo(ExitModal)
