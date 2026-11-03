export type AudioState = {
  muted: boolean
  volume: number
  /** Arrived with the sound off and not yet asked on this device: `SoundHint` offers to turn it on. */
  askToUnmute: boolean
}

export type AudioActions = {
  hydrateAudio: () => void
  toggleMuted: () => void
  setVolume: (volume: number) => void
  /** Unmutes, and lifts a volume of zero back to the default so the sound is actually audible. */
  turnSoundOn: () => void
  dismissSoundHint: () => void
}
