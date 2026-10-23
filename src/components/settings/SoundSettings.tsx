'use client'

import { useId } from 'react'
import { useTranslations } from 'next-intl'
import { useAudioStore } from '@store/audio/store'
import { Toggle } from '@components/ui/Toggle'

export const SoundSettings = () => {
  const t = useTranslations('Settings')
  const muted = useAudioStore.use.muted()
  const volume = useAudioStore.use.volume()
  const toggleMuted = useAudioStore.use.toggleMuted()
  const setVolume = useAudioStore.use.setVolume()
  const id = useId()

  return (
    <div className='flex flex-col gap-4'>
      <Toggle label={t('sound')} checked={!muted} onChange={toggleMuted} />
      <div className='flex flex-col gap-2'>
        <label htmlFor={id} className='font-semibold'>
          {t('volume')}
        </label>
        <input
          id={id}
          type='range'
          min={0}
          max={100}
          step={5}
          value={Math.round(volume * 100)}
          disabled={muted}
          onChange={(event) => setVolume(Number(event.target.value) / 100)}
          className='w-full accent-gold-400 disabled:opacity-40'
        />
      </div>
    </div>
  )
}
