export type SoundState = {
  soundAPIById: Record<string, SoundAPI>
  activeSoundIdsStack: SoundAPI['id'][]
  isMuted: boolean
}

export type SoundAPI = {
  id: string
  play: () => Promise<void>
  pause: () => Promise<void>
  stop: () => Promise<void>
  setMutedStatus: (isMuted: boolean) => Promise<void>
}

export type SoundStateActions = {
  setSoundState: (state: Partial<SoundState>) => void
  playSoundById: (id: SoundAPI['id']) => void
  setIsActiveSoundMuted: (isMuted: SoundState['isMuted']) => void
  toggleActiveSoundMuted: () => void
}
