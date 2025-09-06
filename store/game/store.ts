import { QUESTIONS_MOCK } from '@/constants/questionsMock'
import {
  getAnswerWithGuaranteedProbability,
  getProbabilitiesWithGuaranteedProbabilityForCorrectAnswer,
  sliceArrayContainingCorrectAnswer,
} from '@/helpers/game'
import { Audio, AVPlaybackStatusSuccess } from 'expo-av'
import { create } from 'zustand'
import { combine } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { GameState, GameStateActions, SoundAPI } from './types'

const initialState: GameState = {
  currentQuestionStage: 1,
  lifelines: {
    current: null,
    fiftyFifty: null,
    askAudience: null,
    phoneAFriend: null,
    switchQuestion: null,
  },
  quiz: QUESTIONS_MOCK,
  sound: {
    apiById: {},
    activeIdsStack: [],
    isMuted: true,
  },
  isSidebarOpen: false,
}

export const useGameStore = create<GameState & GameStateActions>()(
  immer(
    combine(initialState, (set, get): GameStateActions => {
      return {
        setGameState: async (payload) => {
          set((prevState) => ({
            ...prevState,
            ...payload,
          }))
        },
        setLifelineNonAvailable: async (payload) => {
          set((prevState) => {
            prevState.lifelines[payload] = null
          })
        },
        setCurrentLifeline: async (payload) => {
          set((prevState) => {
            prevState.lifelines.current = payload
          })
        },
        setIsSidebarOpen: async (isOpen) => {
          set((prevState) => {
            prevState.isSidebarOpen = isOpen
          })
        },
        initSound: async (uri, options) => {
          return new Promise<SoundAPI>(async (resolve) => {
            const id = uri
            const existingSound = get().sound.apiById[id]
            if (existingSound) {
              resolve(existingSound)
              return
            }
            const { loop = false } = options || {}

            const { sound } = await Audio.Sound.createAsync(
              { uri },
              { shouldPlay: false, isMuted: get().sound.isMuted }
            )

            await sound.setIsMutedAsync(get().sound.isMuted)
            await sound.setIsLoopingAsync(loop)

            const api: SoundAPI = {
              id,
              play: async () => {
                await sound.playAsync()
                set((state) => {
                  state.sound.activeIdsStack.push(id)
                })
              },
              playSoundByIdOnEnd: (soundId) => {
                const state = get()
                sound.setOnPlaybackStatusUpdate((status) => {
                  console.log('status', status)

                  if (!status.isLoaded) return
                  if ((status as AVPlaybackStatusSuccess).didJustFinish) {
                    console.log(
                      'setting sound by id on end',
                      JSON.parse(JSON.stringify(state.sound.apiById))
                    )

                    state.sound.apiById[soundId]?.play()
                  }
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
                  state.sound.isMuted = isMuted
                })
              },
              toggleMutedStatus: async () => {
                const isMuted = !get().sound.isMuted
                await sound.setIsMutedAsync(isMuted)
                set((state) => {
                  state.sound.isMuted = isMuted
                })
              },
              unload: async () => {
                await sound.unloadAsync()
                set((state) => {
                  delete state.sound.apiById[id]
                  state.sound.activeIdsStack =
                    state.sound.activeIdsStack.filter((sid) => sid !== id)
                })
              },
            }

            set((state) => {
              state.sound.apiById[id] = api
            })
            resolve(api)
          })
        },
        toggleActiveSoundMuted: () => {
          set((prevState) => {
            const activeId = prevState.sound.activeIdsStack.at(-1)
            const newStatus = !prevState.sound.isMuted
            if (activeId && prevState.sound.apiById[activeId]) {
              prevState.sound.apiById[activeId].setMutedStatus(newStatus)
            }
            prevState.sound.isMuted = newStatus
          })
        },
        setIsActiveSoundMuted: async (isMuted) => {
          const state = get()
          const activeId = state.sound.activeIdsStack.at(-1)
          if (activeId && state.sound.apiById[activeId])
            state.sound.apiById[activeId].setMutedStatus(isMuted)
        },
        playSoundById: (id) => {
          const state = get()
          const activeId = state.sound.activeIdsStack.at(-1)
          if (activeId) state.sound.apiById[activeId].stop()
          state.sound.apiById[id].play()
          state.sound.apiById[id].setMutedStatus(state.sound.isMuted)
        },
        setAnsweredOptionSerialNumber: (serialNumber) => {
          set((prevState) => {
            prevState.quiz[
              prevState.currentQuestionStage - 1
            ].answeredOptionSerialNumber = serialNumber
          })
        },
        setFiftyFiftyLifeline: () => {
          set((prevState) => {
            const randomIncorrectOptions = sliceArrayContainingCorrectAnswer(
              prevState.quiz[prevState.currentQuestionStage - 1]
                .correctOptionSerialNumber
            )
            prevState.lifelines.fiftyFifty = randomIncorrectOptions
          })
        },
        setAskAudienceLifeline: () => {
          set((prevState) => {
            const probabilities =
              getProbabilitiesWithGuaranteedProbabilityForCorrectAnswer(
                prevState.quiz[prevState.currentQuestionStage - 1]
                  .correctOptionSerialNumber,
                0.7
              )
            prevState.lifelines.askAudience = probabilities
          })
        },
        setPhoneAFriendLifeline: () => {
          set((prevState) => {
            const optionSerialNumber = getAnswerWithGuaranteedProbability(
              prevState.quiz[prevState.currentQuestionStage - 1]
                .correctOptionSerialNumber,
              0.7
            )
            prevState.lifelines.phoneAFriend = optionSerialNumber
          })
        },
        setSwitchQuestionLifeline: () => {},
      }
    })
  )
)
