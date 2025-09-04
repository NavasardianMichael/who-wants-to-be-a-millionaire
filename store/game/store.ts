import { Audio } from "expo-av";
import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { GameState, GameStateActions, SoundAPI } from './types';

const initialState: GameState = {
  currentQuestionStage: 1,
  lifelines: {
    current: null,
    available: {
      fiftyFifty: true,
      askAudience: true,
      phoneAFriend: true,
      switchQuestion: true,
    }
  },
  quiz: [
    {
      id: 1,
      question: "What is the capital of France?",
      options: ["Berlin", "Madrid", "Paris", "Rome"],
      answeredOptionSerialNumber: null,
      correctOptionSerialNumber: 3,
    }
  ],
  sound: {
    apiById: {},
    activeIdsStack: [],
    isMuted: false,
  }
}



export const useGameStore = create<GameState & GameStateActions>()(
  immer(
    combine(
      initialState,
      (set): GameStateActions => ({
        setGameState: async (payload) => {
          set((prevState) => {

          })
        },
        setLifelineNonAvailable: async (payload) => {
          set((prevState) => {
            prevState.lifelines.available[payload] = false
          })
        },
        setCurrentLifeline: async (payload) => {
          set((prevState) => {
            prevState.lifelines.current = payload
          })
        },
        initSound: (uri, options) => {
          set((prevState) => {
            const id = uri
            if (!prevState.sound.apiById[id]) {

              const { loop = false, playOnInit = false } = options || {};
              let sound: Audio.Sound | null = null

              const loadSound = async () => {
                if (!sound) {
                  const { sound: newSound } = await Audio.Sound.createAsync(
                    { uri },
                    { shouldPlay: false, isMuted: prevState.sound.isMuted }
                  )
                  sound = newSound
                  await sound?.setIsMutedAsync(prevState.sound.isMuted)
                  // sound.setOnPlaybackStatusUpdate(updateStatus)
                  await sound.setIsLoopingAsync(loop)
                }
              }

              const api: SoundAPI = {
                id,
                play: async () => {
                  // await currentSound?.stop()
                  await loadSound()
                  await sound?.playAsync()
                  prevState.sound.activeIdsStack.push(id)
                },
                pause: async () => {
                  await sound?.pauseAsync()
                },
                stop: async () => {
                  await sound?.stopAsync()
                },
                setMutedStatus: async (isMuted: boolean) => {
                  await sound?.setIsMutedAsync(isMuted)
                },
                toggleMutedStatus: async () => {
                  await sound?.setIsMutedAsync(!prevState.sound.isMuted)
                },
                unload: async () => {
                  // await sound?.unloadAsync()
                  // delete prevState.sound.apiById[id]
                  // prevState.sound.activeIdsStack = prevState.sound.activeIdsStack.filter(sid => sid !== id)
                },
              }

              prevState.sound.apiById[id] = api
              console.log({ api });

              if (playOnInit) api.play()
            }
          })
        },
        toggleActiveSoundMuted: () => {
          set(async (prevState) => {
            const activeId = prevState.sound.activeIdsStack.at(-1)
            if (activeId && prevState.sound.apiById[activeId]) await prevState.sound.apiById[activeId].toggleMutedStatus()
          })
        },
        setIsActiveSoundMuted: (isMuted) => {
          set(async (prevState) => {
            const activeId = prevState.sound.activeIdsStack.at(-1)
            if (activeId && prevState.sound.apiById[activeId]) await prevState.sound.apiById[activeId].setMutedStatus(isMuted)
          })
        },
        setIsSoundMuted: (id, isMuted) => {
          set(async (prevState) => {
            if (prevState.sound.apiById[id]) await prevState.sound.apiById[id].setMutedStatus(isMuted)
          })
        },
        playSoundById: (id) => {
          set(async (prevState) => {
            if (!prevState.sound.apiById[id]) return
            await prevState.sound.apiById[id].play()
            prevState.sound.activeIdsStack.push(id)
          })
        },
        // stopCurrentSound: async () => {
        //   set(async (prevState) => {
        //     await prevState.sound?.stop()
        //   })
        // },
        // playCurrentSound: async () => {
        //   set(async (prevState) => {
        //     await prevState.sound?.play()
        //   })
        // },
      })
    )
  )
)
