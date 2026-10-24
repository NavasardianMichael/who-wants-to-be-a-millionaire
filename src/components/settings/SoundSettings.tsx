'use client'

import { useId } from 'react'
import { Slider } from 'antd'
import { Volume1, Volume2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useAudioStore } from '@store/audio/store'
import { Toggle } from '@components/ui/Toggle'

export const SoundSettings = () => {
  const t = useTranslations('Settings')
  const muted = useAudioStore.use.muted()
  const volume = useAudioStore.use.volume()
  const toggleMuted = useAudioStore.use.toggleMuted()
  const setVolume = useAudioStore.use.setVolume()
  const labelId = useId()

  return (
    <div className='flex flex-col gap-4'>
      <Toggle label={t('sound')} checked={!muted} onChange={toggleMuted} />
      <div className='flex flex-col gap-1'>
        <span id={labelId} className='font-semibold'>
          {t('volume')}
        </span>
        <div className='flex items-center gap-3'>
          <Volume1 aria-hidden className='size-5 shrink-0 text-mist' />
          <Slider
            min={0}
            max={100}
            step={5}
            value={Math.round(volume * 100)}
            disabled={muted}
            onChange={(value) => setVolume(value / 100)}
            tooltip={{ formatter: (value) => `${value}%` }}
            aria-labelledby={labelId}
            className='flex-1'
          />
          <Volume2 aria-hidden className='size-5 shrink-0 text-mist' />
        </div>
      </div>
    </div>
  )
}
