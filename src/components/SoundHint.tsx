'use client'

import { Volume2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useAudioStore } from '@store/audio/store'
import { trackEvent } from '@helpers/analytics'
import { Button } from '@components/ui/Button'
import { Dialog } from '@components/ui/Dialog'

/**
 * Offers the sound — the music and stings carry the show's suspense. A visitor who arrives with
 * it off (muted, or the volume at zero) is asked once per device; one who has it on is asked
 * whenever the browser holds it back until the first click (every reload, in most browsers),
 * and the button is that click. The audio store decides when (`soundHint`).
 */
export const SoundHint = () => {
  const open = useAudioStore.use.soundHint() !== null
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
          <Button variant='secondary' onClick={dismiss}>
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
