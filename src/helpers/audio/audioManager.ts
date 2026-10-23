import { type SoundId,SOUNDS } from './sounds'

/**
 * Two channels, as on the show: a looping **music** bed under the question, and one-shot
 * **stings** (final answer, correct, lifelines) that duck the bed while they play.
 *
 * Sequencing waits on each sting's real `ended` event — the original app slept for
 * hard-coded durations, which drifted the moment a file changed. Every wait also has a
 * ceiling, so a sound that never plays (muted tab, autoplay refused, file missing) can
 * never stall the game.
 *
 * Browser autoplay rules: nothing can sound before the first user gesture. `play()` simply
 * rejects until then, which is swallowed — the game is fully playable silent.
 */
type PlayOptions = {
  /** Upper bound on how long `playSting` may keep the game waiting. */
  maxWaitMs?: number
}

const DUCKED_VOLUME = 0.25

/** A refused `play()` (no gesture yet, muted tab) is expected; the game carries on silently. */
const ignoreAutoplayRefusal = (): void => {}

class AudioManager {
  private music: HTMLAudioElement | null = null
  private musicId: SoundId | null = null
  private stings = new Set<HTMLAudioElement>()
  private muted = false
  private volume = 0.8

  private get available(): boolean {
    return typeof window !== 'undefined' && typeof Audio !== 'undefined'
  }

  configure({ muted, volume }: { muted: boolean; volume: number }): void {
    this.muted = muted
    this.volume = Math.min(1, Math.max(0, volume))
    if (this.music) {
      this.music.muted = muted
      this.music.volume = this.volume
    }
    for (const sting of this.stings) {
      sting.muted = muted
      sting.volume = this.volume
    }
  }

  /** Warms the HTTP cache so the first sting does not wait on the network. */
  preload(ids: SoundId[]): void {
    if (!this.available) return
    for (const id of ids) {
      const audio = new Audio(SOUNDS[id].src)
      audio.preload = 'auto'
    }
  }

  playMusic(id: SoundId): void {
    if (!this.available) return
    if (this.musicId === id && this.music && !this.music.paused) return
    this.stopMusic()

    const audio = new Audio(SOUNDS[id].src)
    audio.loop = true
    audio.muted = this.muted
    audio.volume = this.volume
    this.music = audio
    this.musicId = id
    audio.play().catch(ignoreAutoplayRefusal)
  }

  stopMusic(): void {
    if (!this.music) return
    this.music.pause()
    this.music.src = ''
    this.music = null
    this.musicId = null
  }

  /** Plays a sting; resolves when it ends (or at `maxWaitMs`, whichever is first). */
  playSting(id: SoundId, { maxWaitMs = 12_000 }: PlayOptions = {}): Promise<void> {
    if (!this.available) return Promise.resolve()

    const audio = new Audio(SOUNDS[id].src)
    audio.muted = this.muted
    audio.volume = this.volume
    this.stings.add(audio)
    if (this.music) this.music.volume = this.volume * DUCKED_VOLUME

    return new Promise<void>((resolve) => {
      let settled = false
      const finish = () => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        this.stings.delete(audio)
        if (this.music && this.stings.size === 0) this.music.volume = this.volume
        resolve()
      }
      const timer = setTimeout(finish, this.muted ? 0 : maxWaitMs)
      audio.addEventListener('ended', finish, { once: true })
      audio.addEventListener('error', finish, { once: true })
      audio.play().catch(finish)
    })
  }

  stopStings(): void {
    for (const sting of this.stings) {
      sting.pause()
      sting.dispatchEvent(new Event('ended'))
    }
    this.stings.clear()
  }

  stopAll(): void {
    this.stopStings()
    this.stopMusic()
  }
}

/** One per tab — there is exactly one studio. */
export const audioManager = new AudioManager()
