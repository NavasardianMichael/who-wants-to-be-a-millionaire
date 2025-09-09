import { Audio, AVPlaybackStatusSuccess } from 'expo-av'
import { create } from 'zustand'
import { combine } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { SoundAPI, SoundState, SoundStateActions } from './types'

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
        initSound: async (uri, options) => {
          return new Promise<SoundAPI>(async (resolve) => {
            const id = uri
            const existingSound = get().soundAPIById[id]
            if (existingSound) {
              resolve(existingSound)
              return
            }
            const { loop = false } = options || {}

            const { sound } = await Audio.Sound.createAsync(
              { uri },
              { shouldPlay: false, isMuted: get().isMuted }
            )

            await sound.setIsMutedAsync(get().isMuted)
            await sound.setIsLoopingAsync(loop)

            const api: SoundAPI = {
              id,
              play: async () => {
                set((state) => {
                  state.activeSoundIdsStack.push(id)
                })
                sound.playAsync()
              },
              playSoundByIdOnEnd: (soundId) => {
                const state = get()
                sound.setOnPlaybackStatusUpdate((status) => {
                  if (
                    !status.isLoaded ||
                    !(status as AVPlaybackStatusSuccess).didJustFinish
                  )
                    return
                  state.soundAPIById[soundId].setMutedStatus(state.isMuted)
                  state.soundAPIById[soundId].play()
                })
              },
              pause: async () => {
                await sound.pauseAsync()
              },
              stop: async () => {
                await sound.stopAsync()
              },
              setMutedStatus: async (isMuted: boolean) => {
                sound.setIsMutedAsync(isMuted)
                set((state) => {
                  state.isMuted = isMuted
                })
              },
              toggleMutedStatus: async () => {
                const isMuted = !get().isMuted
                await sound.setIsMutedAsync(isMuted)
                set((state) => {
                  state.isMuted = isMuted
                })
              },
              unload: async () => {
                await sound.unloadAsync()
                set((state) => {
                  delete state.soundAPIById[id]
                  state.activeSoundIdsStack = state.activeSoundIdsStack.filter(
                    (sid) => sid !== id
                  )
                })
              },
              onEnd: (callback) => {
                sound.setOnPlaybackStatusUpdate((status) => {
                  if (
                    !status.isLoaded ||
                    !(status as AVPlaybackStatusSuccess).didJustFinish
                  )
                    return
                  callback()
                })
              },
            }
            set((state) => {
              state.soundAPIById[id] = api
            })
            resolve(api)
          })
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
          const activeId = state.activeSoundIdsStack.at(-1)
          if (activeId) state.soundAPIById[activeId].stop()
          state.soundAPIById[id].play()
          state.soundAPIById[id].setMutedStatus(state.isMuted)
        },
      }
    })
  )
)
