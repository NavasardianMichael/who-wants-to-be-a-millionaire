'use client'

import { Button, Popover, Slider } from 'antd'
import { Volume1, Volume2, VolumeX } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useAudioStore } from '@store/audio/store'
import { trackEvent } from '@helpers/analytics'

/**
 * Mute on click; the volume slider opens on hover (and on keyboard focus, so it is not a
 * mouse-only control). Moving the slider while muted unmutes — a volume you are adjusting
 * should be one you can hear.
 */
export const SoundToggle = () => {
  const muted = useAudioStore.use.muted()
  const volume = useAudioStore.use.volume()
  const toggleMuted = useAudioStore.use.toggleMuted()
  const setVolume = useAudioStore.use.setVolume()
  const t = useTranslations()

  const percent = Math.round(volume * 100)
  const Icon = muted || percent === 0 ? VolumeX : percent < 50 ? Volume1 : Volume2

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

  return (
    <Popover content={slider} trigger={['hover', 'focus']} placement='bottom' mouseLeaveDelay={0.25} arrow={false}>
      <Button
        size='large'
        aria-label={muted ? t('Common.soundOn') : t('Common.soundOff')}
        aria-pressed={!muted}
        icon={<Icon aria-hidden className='size-5' />}
        onClick={() => {
          toggleMuted()
          trackEvent('sound_toggled', { muted: !muted })
        }}
        className='size-11 shrink-0 border-line-strong bg-studio-900/70 text-mist hover:text-ivory'
      />
    </Popover>
  )
}
