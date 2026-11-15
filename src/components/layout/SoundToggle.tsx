'use client'

import { useState } from 'react'
import { Button as AntButton, Popover, Slider } from 'antd'
import { Volume1, Volume2, VolumeX } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useAudioStore } from '@store/audio/store'
import { trackEvent } from '@helpers/analytics'
import { Button } from '@components/ui/Button'

/**
 * Mute on click; the volume slider opens on hover (and on keyboard focus, so it is not a
 * mouse-only control). Moving the slider while muted unmutes — a volume you are adjusting
 * should be one you can hear.
 *
 * It also carries the offer of sound (`soundHint`, decided by the audio store): a visitor who
 * arrived with it off is asked once per device, one who has it on whenever the browser holds it
 * back until the first click, and the button is that click. A small card under the toggle, not a
 * modal: the page stays usable. It renders next to the toggle, so it is next in the tab order.
 */
export const SoundToggle = () => {
  const muted = useAudioStore.use.muted()
  const volume = useAudioStore.use.volume()
  const hintOpen = useAudioStore.use.soundHint() !== null
  const toggleMuted = useAudioStore.use.toggleMuted()
  const setVolume = useAudioStore.use.setVolume()
  const turnSoundOn = useAudioStore.use.turnSoundOn()
  const dismissHint = useAudioStore.use.dismissSoundHint()
  const t = useTranslations()
  const [sliderOpen, setSliderOpen] = useState(false)

  const percent = Math.round(volume * 100)
  const silent = muted || percent === 0
  const Icon = silent ? VolumeX : percent < 50 ? Volume1 : Volume2

  const acceptHint = () => {
    // The click is a user gesture, so the waiting music can start right away.
    turnSoundOn()
    trackEvent('sound_toggled', { muted: false })
  }

  const toggle = () => {
    // While the offer is open the toggle answers it: on when silent, off (declined) when held back.
    if (hintOpen) {
      if (silent) acceptHint()
      else dismissHint()
      return
    }
    toggleMuted()
    trackEvent('sound_toggled', { muted: !muted })
  }

  const slider = (
    <div className='flex h-40 flex-col items-center gap-2 py-1'>
      <span className='font-display text-caption font-bold text-gold-200 tabular'>{muted ? 0 : percent}%</span>
      <Slider
        vertical
        min={0}
        max={100}
        step={5}
        value={muted ? 0 : percent}
        // `setVolume` also unmutes when the value is above zero.
        onChange={(value) => setVolume(value / 100)}
        tooltip={{ open: false }}
        aria-label={t('Settings.volume')}
        className='m-0 flex-1'
      />
    </div>
  )

  const hint = (
    <div role='dialog' aria-labelledby='sound-hint-title' className='flex max-w-72 flex-col gap-3 p-1'>
      <p id='sound-hint-title' className='font-display text-body font-bold text-gold-200'>
        {t('Common.soundHintTitle')}
      </p>
      <p className='text-body-sm text-mist'>{t('Common.soundHintBody')}</p>
      <div className='flex flex-wrap justify-end gap-2'>
        <Button variant='secondary' size='sm' onClick={dismissHint}>
          {t('Common.notNow')}
        </Button>
        <Button size='sm' onClick={acceptHint} icon={<Volume2 aria-hidden className='size-4' />}>
          {t('Common.soundOn')}
        </Button>
      </div>
    </div>
  )

  // One popover, two contents: the offer holds it open; otherwise hover and focus show the slider.
  return (
    <Popover
      content={hintOpen ? hint : slider}
      open={hintOpen || sliderOpen}
      onOpenChange={(next) => {
        if (!hintOpen) setSliderOpen(next)
      }}
      trigger={['hover', 'focus']}
      placement='bottom'
      mouseLeaveDelay={0.25}
      arrow={false}
      getPopupContainer={(trigger) => trigger.parentElement ?? document.body}
    >
      <AntButton
        size='large'
        aria-label={muted ? t('Common.soundOn') : t('Common.soundOff')}
        aria-pressed={!muted}
        icon={<Icon aria-hidden className='size-5' />}
        onClick={toggle}
        className='size-11 shrink-0 border-line-strong bg-studio-900/70 text-mist hover:text-ivory'
      />
    </Popover>
  )
}
