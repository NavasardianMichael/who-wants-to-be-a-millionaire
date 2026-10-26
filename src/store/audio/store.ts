import { create } from 'zustand'
import { combine } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { appendSelectors } from '@store/appendSelectors'
import { STORAGE_KEYS } from '@constants/app'
import { audioManager } from '@helpers/audio/audioManager'
import { readJson, writeJson } from '@helpers/storage'
import { AudioActions, AudioState } from './types'

const initialState: AudioState = { muted: false, volume: 0.8 }

const persist = (state: AudioState) => {
  writeJson(STORAGE_KEYS.audio, { muted: state.muted, volume: state.volume })
  audioManager.configure(state)
}

export const useAudioStoreBase = create<AudioState & AudioActions>()(
  immer(
    combine(
      initialState,
      (set, get): AudioActions => ({
        /** Called once on mount; the server render always assumes the defaults. */
        hydrateAudio: () => {
          const stored = readJson<Partial<AudioState>>(STORAGE_KEYS.audio, {})
          set((state) => {
            state.muted = Boolean(stored.muted)
            state.volume = typeof stored.volume === 'number' ? stored.volume : initialState.volume
          })
          audioManager.configure(get())
        },
        toggleMuted: () => {
          set((state) => {
            state.muted = !state.muted
          })
          persist(get())
        },
        setVolume: (volume) => {
          set((state) => {
            state.volume = Math.min(1, Math.max(0, volume))
            if (state.volume > 0) state.muted = false
          })
          persist(get())
        },
      })
    )
  )
)

export const useAudioStore = appendSelectors(useAudioStoreBase)
