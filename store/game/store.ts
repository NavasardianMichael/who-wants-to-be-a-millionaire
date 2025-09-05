import { QUESTIONS_MOCK } from '@/constants/questionsMock';
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
  quiz: QUESTIONS_MOCK,
  sound: {
    apiById: {},
    activeIdsStack: [],
    isMuted: true,
  }
}



export const useGameStore = create<GameState & GameStateActions>()(
  immer(
    combine(
      initialState,
      (set, get): GameStateActions => {
        return {
          setGameState: async (payload) => {
            set((prevState) => ({
              ...prevState,
              ...payload
            }))
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
          initSound: async (uri, options) => {
            return new Promise<SoundAPI>(async (resolve) => {
              const id = uri;
              const existingSound = get().sound.apiById[id]
              if (existingSound) {
                resolve(existingSound)
                return
              }
              const { loop = false } = options || {};

              const { sound } = await Audio.Sound.createAsync(
                { uri },
                { shouldPlay: false, isMuted: get().sound.isMuted }
              );

              await sound.setIsMutedAsync(get().sound.isMuted);
              await sound.setIsLoopingAsync(loop);

              const api: SoundAPI = {
                id,
                play: async () => {
                  await sound.playAsync();
                  set((state) => {
                    state.sound.activeIdsStack.push(id);
                    // sound.setOnPlaybackStatusUpdate((status) => {
                    //   if (!status.isLoaded) return
                    //   if ((status as AVPlaybackStatusSuccess).didJustFinish) {
                    //     state.sound.activeIdsStack.pop()
                    //     const newActiveId = state.sound.activeIdsStack.at(-1)
                    //     if (newActiveId && state.sound.apiById[newActiveId]) {
                    //       state.sound.apiById[newActiveId].setMutedStatus(state.sound.isMuted)
                    //       state.sound.apiById[newActiveId].play()
                    //     }
                    //   }
                    // })
                  });
                },
                pause: async () => {
                  await sound.pauseAsync();
                },
                stop: async () => {
                  await sound.stopAsync();
                },
                setMutedStatus: async (isMuted: boolean) => {
                  sound.setIsMutedAsync(isMuted);
                  set((state) => {
                    state.sound.isMuted = isMuted;
                  });
                },
                toggleMutedStatus: async () => {
                  const isMuted = !get().sound.isMuted;
                  await sound.setIsMutedAsync(isMuted);
                  set((state) => {
                    state.sound.isMuted = isMuted;
                  });
                },
                unload: async () => {
                  await sound.unloadAsync();
                  set((state) => {
                    delete state.sound.apiById[id];
                    state.sound.activeIdsStack = state.sound.activeIdsStack.filter(
                      (sid) => sid !== id
                    );
                  });
                },
              };

              set((state) => {
                state.sound.apiById[id] = api;
              });
              resolve(api);
            });
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
            if (activeId && state.sound.apiById[activeId]) state.sound.apiById[activeId].setMutedStatus(isMuted)
          },
          playSoundById: (id) => {
            const state = get()
            const activeId = state.sound.activeIdsStack.at(-1)
            if (activeId) state.sound.apiById[activeId].pause()
            state.sound.apiById[id].play()
            state.sound.apiById[id].setMutedStatus(state.sound.isMuted)
          },
          setAnsweredOptionSerialNumber: (serialNumber) => {
            set((prevState) => {
              prevState.quiz[prevState.currentQuestionStage - 1].answeredOptionSerialNumber = serialNumber
            })
          }
        }
      }
    )
  )
)
