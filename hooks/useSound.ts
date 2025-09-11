import { useSoundStore } from '@/store/sound/store'
import { SoundAPI } from '@/store/sound/types'
import { useAudioPlayer } from 'expo-audio'
import { useEffect, useMemo } from 'react'

type UseSound = (
  uri: string,
  options?: { loop?: boolean; playOnInit?: boolean }
) => Promise<SoundAPI>

export const useSound: UseSound = (uri, options) => {
  const soundStore = useSoundStore()
  const { loop = false } = options || {}
  const sound = useAudioPlayer(uri)

  const api: Promise<SoundAPI> = useMemo(() => {
    return new Promise<SoundAPI>((resolve) => {
      const id = uri
      const existingSound = soundStore.soundAPIById[id]
      if (existingSound) {
        resolve(existingSound)
        return
      }
      const result: SoundAPI = {
        id,
        play: async () => {
          soundStore.setSoundState({
            activeSoundIdsStack: [...soundStore.activeSoundIdsStack, id],
          })
          sound.seekTo(0)
          sound.loop = loop
          sound.play()
        },
        playSoundByIdOnEnd: (soundId) => {
          sound.addListener('playbackStatusUpdate', (status) => {
            console.log({ status })
            if (status.didJustFinish) {
              soundStore.soundAPIById[soundId].setMutedStatus(
                soundStore.isMuted
              )
              soundStore.soundAPIById[soundId].play()
            }
          })
        },
        pause: async () => {
          sound.pause()
        },
        stop: async () => {
          sound.pause()
        },
        setMutedStatus: async (isMuted: boolean) => {
          sound.volume = Number(!isMuted)
          soundStore.setSoundState({ isMuted })
        },
        toggleMutedStatus: async () => {
          const isMuted = !soundStore.isMuted
          sound.volume = Number(isMuted)
          soundStore.setSoundState({ isMuted })
        },
        onEnd: (callback) => {
          sound.addListener('playbackStatusUpdate', (status) => {
            console.log({ status })
            if (status.didJustFinish) callback()
          })
        },
      }
      resolve(result)
    })
  }, [sound, soundStore, uri])

  useEffect(() => {
    const initSound = async () => {
      if (soundStore.soundAPIById[uri]) return
      soundStore.setSoundState({
        soundAPIById: { ...soundStore.soundAPIById, [uri]: await api },
      })
    }
    initSound()
  }, [api, soundStore, uri])

  return api
}
