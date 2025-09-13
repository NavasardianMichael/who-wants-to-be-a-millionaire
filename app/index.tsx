import AppLinkAsButton from '@/components/ui/AppLinkAsButton'
import { ROUTES } from '@/constants/routes'
import { SOUNDS_URIS } from '@/constants/sound'
import { useSound } from '@/hooks/useSound'
import { useGameStore } from '@/store/game/store'
import { useSoundStore } from '@/store/sound/store'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Text, View } from 'react-native'

export default function Index() {
  const { playSoundById } = useSoundStore()
  const { currentQuestionStage, pendingQuizItemStage } = useGameStore()
  const { t } = useTranslation()

  useSound(SOUNDS_URIS.resign)

  const isNextQuizItemLoading = useMemo(() => {
    return pendingQuizItemStage === currentQuestionStage
  }, [currentQuestionStage, pendingQuizItemStage])

  return (
    <View className='flex-1 bg-primary'>
      <Text className='text-xl text-center text-white font-bold'>
        {t('who-wants-to-be-a-millionaire')}
      </Text>
      <View className='flex flex-1 justify-center items-center gap-4'>
        <AppLinkAsButton
          href={ROUTES.game}
          disabled={isNextQuizItemLoading}
          className={isNextQuizItemLoading ? 'opacity-50' : ''}
          onPress={(e) => {
            if (isNextQuizItemLoading) {
              e.preventDefault()
              e.stopPropagation()
              return
            }
            playSoundById(SOUNDS_URIS.resign)
          }}
        >
          {isNextQuizItemLoading ? 'AI is working...' : 'Start Game'}
        </AppLinkAsButton>
        <AppLinkAsButton href={ROUTES.settings}>Settings</AppLinkAsButton>
      </View>
    </View>
  )
}
