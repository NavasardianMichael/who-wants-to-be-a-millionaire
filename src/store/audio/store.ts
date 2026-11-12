import { create } from 'zustand'
import { combine } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { appendSelectors } from '@store/appendSelectors'
import { STORAGE_KEYS } from '@constants/app'
import { audioManager } from '@helpers/audio/audioManager'
import { readJson, writeJson } from '@helpers/storage'
import { AudioActions, AudioState } from './types'

const initialState: AudioState = { muted: false, volume: 0.8, soundHint: null }

/** Until hydration the store holds the defaults, not the player's choice: no hint can be decided yet. */
let hydrated = false

const persist = (state: AudioState) => {
  writeJson(STORAGE_KEYS.audio, { muted: state.muted, volume: state.volume })
  audioManager.configure(state)
}

const audible = (state: AudioState) => !state.muted && state.volume > 0

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
          const on = !muted && volume > 0
          // Arriving with the sound off is asked once per device, on arrival only: muting later in
          // the visit is a choice. Marked as asked right away, so a reload without answering does
          // not ask again. A second call (Strict Mode runs mount effects twice) keeps the pending
          // question rather than dropping it.
          const askMuted = !on && !readJson<boolean>(STORAGE_KEYS.soundHintShown, false)
          if (askMuted) writeJson(STORAGE_KEYS.soundHintShown, true)
          const soundHint =
            get().soundHint ?? (askMuted ? 'muted' : on && audioManager.playbackBlocked ? 'blocked' : null)
          set((state) => {
            state.muted = muted
            state.volume = volume
            state.soundHint = soundHint
          })
          hydrated = true
          if (soundHint === 'blocked') audioManager.hold()
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
            state.soundHint = null
          })
          persist(get())
          audioManager.release()
        },
        dismissSoundHint: () => {
          const declined = get().soundHint === 'blocked'
          set((state) => {
            if (declined) state.muted = true
            state.soundHint = null
          })
          if (declined) {
            // The toggle then shows what is heard; once declined, the muted arrival is not asked about.
            writeJson(STORAGE_KEYS.soundHintShown, true)
            persist(get())
          }
          audioManager.release()
        },
        playbackBlockedChanged: (blocked) => {
          if (!hydrated) return
          const { soundHint } = get()
          if (blocked && !soundHint && audible(get())) {
            set((state) => {
              state.soundHint = 'blocked'
            })
            audioManager.hold()
          } else if (!blocked && soundHint === 'blocked') {
            set((state) => {
              state.soundHint = null
            })
          }
        },
      })
    )
  )
)

audioManager.onPlaybackBlocked((blocked) => useAudioStoreBase.getState().playbackBlockedChanged(blocked))

export const useAudioStore = appendSelectors(useAudioStoreBase)
