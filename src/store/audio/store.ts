import { create } from 'zustand'
import { combine } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { appendSelectors } from '@store/appendSelectors'
import { STORAGE_KEYS } from '@constants/app'
import { audioManager } from '@helpers/audio/audioManager'
import { readJson, writeJson } from '@helpers/storage'
import { AudioActions, AudioState } from './types'

const initialState: AudioState = { muted: false, volume: 0.8, askToUnmute: false }

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
          const muted = Boolean(stored.muted)
          const volume = typeof stored.volume === 'number' ? stored.volume : initialState.volume
          // Asked once per device, on arrival only: muting later in the visit is a choice. Marked
          // as asked right away, so a reload without answering does not ask again. A second call
          // (Strict Mode runs mount effects twice) keeps the pending question rather than dropping it.
          const askToUnmute =
            get().askToUnmute || ((muted || volume === 0) && !readJson<boolean>(STORAGE_KEYS.soundHintShown, false))
          if (askToUnmute) writeJson(STORAGE_KEYS.soundHintShown, true)
          set((state) => {
            state.muted = muted
            state.volume = volume
            state.askToUnmute = askToUnmute
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
        turnSoundOn: () => {
          set((state) => {
            state.muted = false
            if (state.volume === 0) state.volume = initialState.volume
            state.askToUnmute = false
          })
          persist(get())
        },
        dismissSoundHint: () => {
          set((state) => {
            state.askToUnmute = false
          })
        },
      })
    )
  )
)

export const useAudioStore = appendSelectors(useAudioStoreBase)
