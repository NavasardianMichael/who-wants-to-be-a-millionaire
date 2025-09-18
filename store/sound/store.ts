import { create } from 'zustand'
import { combine } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { SoundState, SoundStateActions } from './types'

const initialState: SoundState = {
  soundAPIById: {},
  activeSoundIdsStack: [],
  isMuted: true,
}

export const useSoundStore = create<SoundState & SoundStateActions>()(
  immer(
    combine(initialState, (set, get): SoundStateActions => {
      return {
        setSoundState: async (payload) => {
          set((prevState) => ({
            ...prevState,
            ...payload,
          }))
        },

        toggleActiveSoundMuted: () => {
          set((prevState) => {
            const activeId = prevState.activeSoundIdsStack.at(-1)
            const newStatus = !prevState.isMuted
            if (activeId && prevState.soundAPIById[activeId]) {
              prevState.soundAPIById[activeId].setMutedStatus(newStatus)
            }
            prevState.isMuted = newStatus
          })
        },
        setIsActiveSoundMuted: async (isMuted) => {
          const state = get()
          const activeId = state.activeSoundIdsStack.at(-1)
          if (activeId && state.soundAPIById[activeId])
            state.soundAPIById[activeId].setMutedStatus(isMuted)
        },
        playSoundById: (id) => {
          const state = get()
          if (!state.soundAPIById[id]) return
          const activeId = state.activeSoundIdsStack.at(-1)

          if (activeId) state.soundAPIById[activeId].stop()
          state.soundAPIById[id].play()
          state.soundAPIById[id].setMutedStatus(state.isMuted)
        },
      }
    })
  )
)
