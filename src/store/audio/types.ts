export type AudioState = {
  muted: boolean
  volume: number
  /**
   * Why `SoundHint` offers to turn the sound on: the visitor arrived with it off and was not yet
   * asked on this device (`muted`), or it is on but the browser holds it back until the first
   * click on the page (`blocked`) — the offer's button is that click.
   */
  soundHint: 'muted' | 'blocked' | null
}

export type AudioActions = {
  hydrateAudio: () => void
  toggleMuted: () => void
  setVolume: (volume: number) => void
  /** Unmutes, and lifts a volume of zero back to the default so the sound is actually audible. */
  turnSoundOn: () => void
  /** "Not now": closes the hint; declining sound the browser was holding back mutes it. */
  dismissSoundHint: () => void
  /** Wired to `audioManager.onPlaybackBlocked`. */
  playbackBlockedChanged: (blocked: boolean) => void
}
