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
  unload: () => Promise<void>
  setMutedStatus: (isMuted: boolean) => Promise<void>
  toggleMutedStatus: () => Promise<void>
  onEnd: (callback: () => void) => void
  playSoundByIdOnEnd: (id: SoundAPI['id']) => void
}

export type SoundStateActions = {
  setSoundState: (state: Partial<SoundState>) => void
  initSound: (
    uri: string,
    options?: { loop?: boolean; playOnInit?: boolean }
  ) => Promise<SoundAPI>
  playSoundById: (id: SoundAPI['id']) => void
  setIsActiveSoundMuted: (isMuted: SoundState['isMuted']) => void
  toggleActiveSoundMuted: () => void
}
