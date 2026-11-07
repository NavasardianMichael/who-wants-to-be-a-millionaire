import { SAFE_HAVEN_STAGES } from '@constants/game'

/**
 * Bump when any file in `public/audio/` changes. The files are not content-hashed, so the
 * version in their URLs is what keeps a browser's HTTP cache and the service worker's cache
 * from playing the old copy.
 */
const SOUND_VERSION = 7

const audio = (file: string): string => `/audio/${file}?v=${SOUND_VERSION}`

/**
 * The game's sounds (`public/audio/`), all CC0 — sources and edits in `docs/AUDIO_CREDITS.md`.
 * A replacement keeps within the sting ceilings the game store sets (`maxWaitMs`) and ships
 * with a `SOUND_VERSION` bump.
 *
 * `music` tracks loop under a question; everything else is a one-shot sting. The music
 * (`mainTheme`, `easy`, `medium`, `hard`) is cached by the service worker on first play
 * rather than precached, so installing the app does not cost 2.5 MB up front.
 */
export const SOUNDS = {
  mainTheme: { src: audio('main-theme.mp3'), music: true },
  /** The "let's play" sting when a game starts. */
  start: { src: audio('start.mp3'), music: false },
  easy: { src: audio('easy.mp3'), music: true },
  medium: { src: audio('medium.mp3'), music: true },
  hard: { src: audio('hard.mp3'), music: true },
  /** The click of picking an answer: an effect over the bed (`playEffect`), not a sting. */
  select: { src: audio('select.mp3'), music: false },
  finalAnswer: { src: audio('final-answer.mp3'), music: false },
  correct: { src: audio('correct-answer.mp3'), music: false },
  wrong: { src: audio('wrong-answer.mp3'), music: false },
  next: { src: audio('next.mp3'), music: false },
  fiftyFifty: { src: audio('fifty-fifty.mp3'), music: false },
  phoneAFriend: { src: audio('phone-a-friend.mp3'), music: false },
  askAudience: { src: audio('audience-help.mp3'), music: false },
  millionaire: { src: audio('you-won-a-million.mp3'), music: false },
} as const

export type SoundId = keyof typeof SOUNDS

/** Short stings precached by the service worker; the music beds are cached lazily. */
export const PRECACHED_SOUNDS: SoundId[] = ['start', 'select', 'finalAnswer', 'correct', 'wrong', 'next', 'fiftyFifty', 'askAudience', 'millionaire']

/**
 * Question music by stage, three beds rising in tension: questions 1–5, 6–10, then 11 on — they
 * change after each safe haven. By stage, not by question level: levels come in threes and
 * shift with the difficulty setting. Marathon and Time Attack count their questions the same way.
 */
export const musicForStage = (stage: number): SoundId =>
  stage <= SAFE_HAVEN_STAGES[0] ? 'easy' : stage <= SAFE_HAVEN_STAGES[1] ? 'medium' : 'hard'
