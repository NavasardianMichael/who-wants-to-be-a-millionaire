import { type SoundId,SOUNDS } from './sounds'

/**
 * Two channels, as on the show: a looping **music** bed under the question, and one-shot
 * **stings** (final answer, correct, lifelines). A sting has the floor to itself: the bed
 * pauses while it plays and picks up where it left off afterwards.
 *
 * Sequencing waits on each sting's real `ended` event — the original app slept for
 * hard-coded durations, which drifted the moment a file changed. Every wait also has a
 * ceiling, so a sound that never plays (muted tab, autoplay refused, file missing) can
 * never stall the game.
 *
 * Browser autoplay rules: nothing can sound before the first user gesture. A refused music
 * bed is retried on that gesture; a refused sting is simply skipped — the game is fully
 * playable silent.
 */
type PlayOptions = {
  /** Upper bound on how long `playSting` may keep the game waiting. */
  maxWaitMs?: number
}

/**
 * A breath between one sound and the next: back-to-back stings (final answer → correct →
 * next) and the music picking up after them otherwise run into each other.
 */
const GAP_MS = 350

/** A refused `play()` (no gesture yet, muted tab) is expected; the game carries on silently. */
const ignoreAutoplayRefusal = (): void => {}

class AudioManager {
  private music: HTMLAudioElement | null = null
  private musicId: SoundId | null = null
  private stings = new Set<HTMLAudioElement>()
  private muted = false
  private volume = 0.8
  /** Nothing new starts before this moment (epoch ms): the silence after the last sting. */
  private quietUntil = 0

  private get quietMs(): number {
    return Math.max(0, this.quietUntil - Date.now())
  }

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
    // Refused before the first gesture (autoplay rules): start it on the first click or key instead.
    const start = () => {
      if (this.music === audio && this.stings.size === 0) audio.play().catch(() => this.resumeOnGesture(audio))
    }
    const wait = this.quietMs
    if (wait) setTimeout(start, wait)
    else start()
  }

  private resumeOnGesture(audio: HTMLAudioElement): void {
    const resume = () => {
      document.removeEventListener('pointerdown', resume, true)
      document.removeEventListener('keydown', resume, true)
      // Only if that bed is still the one meant to play.
      if (this.music === audio && audio.paused) audio.play().catch(ignoreAutoplayRefusal)
    }
    document.addEventListener('pointerdown', resume, true)
    document.addEventListener('keydown', resume, true)
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
    this.music?.pause()

    return new Promise<void>((resolve) => {
      let settled = false
      const finish = () => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        this.stings.delete(audio)
        this.quietUntil = Date.now() + GAP_MS
        const music = this.music
        if (music && this.stings.size === 0) {
          setTimeout(() => {
            if (this.music === music && this.stings.size === 0) music.play().catch(ignoreAutoplayRefusal)
          }, GAP_MS)
        }
        resolve()
      }
      const timer = setTimeout(finish, this.muted ? 0 : maxWaitMs)
      audio.addEventListener('ended', finish, { once: true })
      audio.addEventListener('error', finish, { once: true })
      const wait = this.quietMs
      const start = () => {
        if (!settled) audio.play().catch(finish)
      }
      if (wait) setTimeout(start, wait)
      else start()
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
