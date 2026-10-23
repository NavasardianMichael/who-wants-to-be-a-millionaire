'use client'

import { Volume2, VolumeX } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useAudioStore } from '@store/audio/store'
import { trackEvent } from '@helpers/analytics'
import { IconButton } from '@components/ui/IconButton'

export const SoundToggle = () => {
  const muted = useAudioStore.use.muted()
  const toggleMuted = useAudioStore.use.toggleMuted()
  const t = useTranslations('Common')

  return (
    <IconButton
      label={muted ? t('soundOn') : t('soundOff')}
      aria-pressed={!muted}
      icon={muted ? <VolumeX className='size-5' /> : <Volume2 className='size-5' />}
      onClick={() => {
        toggleMuted()
        trackEvent('sound_toggled', { muted: !muted })
      }}
    />
  )
}
