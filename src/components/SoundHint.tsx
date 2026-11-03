'use client'

import { Volume2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useAudioStore } from '@store/audio/store'
import { trackEvent } from '@helpers/analytics'
import { Button } from '@components/ui/Button'
import { Dialog } from '@components/ui/Dialog'

/**
 * A visitor who arrives with the sound off (muted, or the volume at zero) is asked once per
 * device to turn it on — the music and stings carry the show's suspense. The audio store
 * decides when to ask (`askToUnmute`, set on hydration).
 */
export const SoundHint = () => {
  const open = useAudioStore.use.askToUnmute()
  const turnSoundOn = useAudioStore.use.turnSoundOn()
  const dismiss = useAudioStore.use.dismissSoundHint()
  const t = useTranslations('Common')

  const accept = () => {
    // The click is a user gesture, so the waiting music can start right away.
    turnSoundOn()
    trackEvent('sound_toggled', { muted: false })
  }

  return (
    <Dialog
      open={open}
      onClose={dismiss}
      title={t('soundHintTitle')}
      description={t('soundHintBody')}
      footer={
        <>
          <Button variant='ghost' onClick={dismiss}>
            {t('notNow')}
          </Button>
          <Button onClick={accept} icon={<Volume2 aria-hidden className='size-5' />}>
            {t('soundOn')}
          </Button>
        </>
      }
    />
  )
}
