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
  const audioPlayer = useAudioPlayer(uri)

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
          audioPlayer.seekTo(0)
          audioPlayer.loop = loop
          audioPlayer.play()
        },
        playSoundByIdOnEnd: (soundId) => {
          audioPlayer.addListener('playbackStatusUpdate', (status) => {
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
          audioPlayer.pause()
        },
        stop: async () => {
          audioPlayer.pause()
        },
        setMutedStatus: async (isMuted: boolean) => {
          audioPlayer.volume = Number(!isMuted)
          soundStore.setSoundState({ isMuted })
        },
        toggleMutedStatus: async () => {
          const isMuted = !soundStore.isMuted
          audioPlayer.volume = Number(isMuted)
          soundStore.setSoundState({ isMuted })
        },
        onEnd: (callback) => {
          audioPlayer.addListener('playbackStatusUpdate', (status) => {
            console.log({ status })
            if (status.didJustFinish) callback()
          })
        },
      }
      resolve(result)
    })
  }, [audioPlayer, loop, soundStore, uri])

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
