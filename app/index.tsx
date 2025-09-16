import AppLinkAsButton from '@/components/ui/AppLinkAsButton'
import { ROUTES } from '@/constants/routes'
import { SOUNDS_URIS } from '@/constants/sound'
import { useSound } from '@/hooks/useSound'
import { useGameStore } from '@/store/game/store'
import { useSettingsStore } from '@/store/settings/store'
import { useSoundStore } from '@/store/sound/store'
import { useTranslation } from 'react-i18next'
import { Text, View } from 'react-native'

export default function Index() {
  const { playSoundById } = useSoundStore()
  const { language } = useSettingsStore()
  const { isPending, initQuiz } = useGameStore()
  const { t } = useTranslation()

  useSound(SOUNDS_URIS.resign)

  return (
    <View className='flex-1 bg-primary'>
      <Text className='text-xl text-center text-white font-bold'>
        {t('who-wants-to-be-a-millionaire')}
      </Text>
      <View className='flex flex-1 justify-center items-center gap-4'>
        <AppLinkAsButton
          href={ROUTES.game}
          disabled={isPending}
          className={isPending ? 'opacity-50' : ''}
          onPress={(e) => {
            if (isPending) {
              e.preventDefault()
              e.stopPropagation()
              return
            }
            playSoundById(SOUNDS_URIS.resign)
            initQuiz({ language })
          }}
        >
          {t('start-game')}
        </AppLinkAsButton>
        <AppLinkAsButton href={ROUTES.settings}>
          {t('settings')}
        </AppLinkAsButton>
      </View>
    </View>
  )
}
