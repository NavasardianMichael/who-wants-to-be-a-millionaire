import { type SoundId,SOUNDS } from './sounds'

/**
 * Two channels, as on the show: a looping **music** bed under the question, and one-shot
 * **stings** (final answer, correct, lifelines). A sting has the floor to itself: the bed
 * pauses while it plays and picks up where it left off afterwards.
 *
 * Sequencing waits on each sting's real `ended` event — the original app slept for
 * hard-coded durations, which drifted the moment a file changed. Every wait also has a
 * ceiling, so a sound that never plays (muted tab, autoplay refused, file missing) can
 * never stall the game. A sting is the sound of one beat: when its ceiling passes, the game
 * moves on and the sting fades out with it rather than play on under the next beat.
 *
 * Browser autoplay rules: nothing can sound before the first user gesture. A refused music
 * bed is retried on that gesture; a refused sting is simply skipped — the game is fully
 * playable silent.
 *
 * A hidden page (a locked phone, another app or tab) is silent: the bed pauses and resumes on
 * return, a sting in flight is dropped. Pausing rather than muting matters on iOS, where a
 * muted element still plays on the lock screen and keeps the media session alive.
 */
type PlayOptions = {
  /** Upper bound on how long `playSting` may keep the game waiting. */
  maxWaitMs?: number
}

/**
 * How a sting stopped: it played out, the game moved on past its ceiling (it fades), or it
 * was cut (the next beat's sound takes over at once).
 */
type StingEnd = 'ended' | 'timeout' | 'cut'

/**
 * A breath between one sound and the next: back-to-back stings (final answer → correct →
 * next) and the music picking up after them otherwise run into each other.
 */
const GAP_MS = 350

/** A sting overtaken by the game. iOS ignores `volume`, so there it is a cut at the end. */
const FADE_MS = 250

/** A refused `play()` (no gesture yet, muted tab) is expected; the game carries on silently. */
const ignoreAutoplayRefusal = (): void => {}

class AudioManager {
  private music: HTMLAudioElement | null = null
  private musicId: SoundId | null = null
  /** Stings playing, each with the function that ends it. */
  private stings = new Map<HTMLAudioElement, (how: StingEnd) => void>()
  /** Stings started muted: the game no longer waits on them, so the next sting cuts them. */
  private released = new Set<HTMLAudioElement>()
  private fading = new Set<HTMLAudioElement>()
  private muted = false
  private volume = 0.8
  private hidden = false
  /** Nothing new starts before this moment (epoch ms): the silence after the last sting. */
  private quietUntil = 0

  constructor() {
    if (typeof document === 'undefined') return
    this.hidden = document.hidden
    document.addEventListener('visibilitychange', () => {
      this.hidden = document.hidden
      if (this.hidden) {
        this.music?.pause()
        this.stopStings()
      } else {
        this.resumeMusic()
      }
    })
  }

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
    for (const sting of this.stings.keys()) {
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
    this.resumeMusic(this.quietMs)
  }

  /** Starts (or restarts) the bed — unless a sting has the floor or the page is hidden. */
  private resumeMusic(delayMs = 0): void {
    const music = this.music
    if (!music) return
    const resume = () => {
      // Refused before the first gesture (autoplay rules): start it on the first click or key instead.
      if (this.music === music && music.paused && this.stings.size === 0 && !this.hidden) {
        music.play().catch(() => this.resumeOnGesture(music))
      }
    }
    if (delayMs) setTimeout(resume, delayMs)
    else resume()
  }

  private resumeOnGesture(audio: HTMLAudioElement): void {
    const resume = () => {
      document.removeEventListener('pointerdown', resume, true)
      document.removeEventListener('keydown', resume, true)
      // Only if that bed is still the one meant to play.
      if (this.music === audio && audio.paused && this.stings.size === 0) audio.play().catch(ignoreAutoplayRefusal)
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
    if (!this.available || this.hidden) return Promise.resolve()

    for (const [sting, finish] of this.stings) if (this.released.has(sting)) finish('cut')

    const audio = new Audio(SOUNDS[id].src)
    audio.muted = this.muted
    audio.volume = this.volume
    this.music?.pause()

    return new Promise<void>((resolve) => {
      const finish = (how: StingEnd) => {
        if (!this.stings.has(audio)) return
        clearTimeout(timer)
        this.stings.delete(audio)
        this.released.delete(audio)
        if (how === 'timeout') this.fadeOut(audio)
        else audio.pause()
        // A sting that played out leaves a breath; one the game cut hands over at once, so the
        // next beat's sound lands together with its action.
        if (how === 'ended') this.quietUntil = Date.now() + GAP_MS
        this.resumeMusic(how === 'ended' ? GAP_MS : 0)
        resolve()
      }
      this.stings.set(audio, finish)
      const timer = setTimeout(() => finish('timeout'), maxWaitMs)
      // Muted, the game does not wait on a sound nobody hears, but the sting still runs its
      // course silently: sound switched back on mid-beat comes in where the beat is.
      if (this.muted) {
        this.released.add(audio)
        resolve()
      }
      audio.addEventListener('ended', () => finish('ended'), { once: true })
      audio.addEventListener('error', () => finish('cut'), { once: true })
      const start = () => {
        if (this.stings.has(audio)) audio.play().catch(() => finish('cut'))
      }
      const wait = this.quietMs
      if (wait) setTimeout(start, wait)
      else start()
    })
  }

  private fadeOut(audio: HTMLAudioElement): void {
    this.fading.add(audio)
    const from = audio.volume
    const startedAt = Date.now()
    const step = setInterval(() => {
      const left = 1 - (Date.now() - startedAt) / FADE_MS
      if (left > 0 && this.fading.has(audio)) {
        audio.volume = from * left
        return
      }
      clearInterval(step)
      audio.pause()
      this.fading.delete(audio)
    }, 25)
  }

  stopStings(): void {
    for (const finish of [...this.stings.values()]) finish('cut')
    for (const audio of this.fading) audio.pause()
    this.fading.clear()
  }

  stopAll(): void {
    this.stopMusic()
    this.stopStings()
  }
}

/** One per tab — there is exactly one studio. */
export const audioManager = new AudioManager()
