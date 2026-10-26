export type AudioState = {
  muted: boolean
  volume: number
}

export type AudioActions = {
  hydrateAudio: () => void
  toggleMuted: () => void
  setVolume: (volume: number) => void
}
