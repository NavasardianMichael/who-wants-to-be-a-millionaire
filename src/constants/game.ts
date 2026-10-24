/**
 * Game rules shared by the web app and the API.
 *
 * **Twin file.** `src/constants/game.ts` (web) and `server/src/lib/game.ts` (API) must stay
 * byte-identical below the marker line — `tests/unit/game/twins.spec.ts` fails on drift.
 * The server cannot import from `src/` (separate package, NodeNext resolution), which is
 * why the rules are duplicated rather than shared.
 */
// --- twin: keep identical below this line ---

/** Prize per Classic stage, in USD. Index 0 is stage 1. */
export const LADDER = [
  100, 200, 300, 500, 1000, 2000, 4000, 8000, 16000, 32000, 64000, 125000, 250000, 500000, 1000000,
] as const

export const STAGES_COUNT = LADDER.length

/** Guaranteed checkpoints: answering these stages correctly banks their prize. */
export const SAFE_HAVEN_STAGES = [5, 10] as const

export const LEVELS = [1, 2, 3, 4, 5] as const
export type Level = (typeof LEVELS)[number]

/** Classic stage (1-based) → question difficulty level: three stages per level. */
export const STAGE_LEVELS: readonly Level[] = [1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5]

export const CATEGORIES = [
  'general',
  'history',
  'geography',
  'science',
  'nature',
  'literature',
  'art',
  'music',
  'filmTv',
  'sports',
  'technology',
  'food',
  'mythology',
  'language',
  'popCulture',
  'localCulture',
] as const
export type Category = (typeof CATEGORIES)[number]

export const LIFELINES = ['fiftyFifty', 'askAudience', 'phoneAFriend', 'switchQuestion'] as const
export type Lifeline = (typeof LIFELINES)[number]

export const GAME_MODES = ['classic', 'marathon', 'timeAttack'] as const
export type GameMode = (typeof GAME_MODES)[number]

export const RANKED_MODES = ['marathon', 'timeAttack'] as const
export type RankedMode = (typeof RANKED_MODES)[number]

export const OPTIONS_COUNT = 4
export const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const

export const MARATHON_RULES = {
  /** Seconds per question in a ranked run. */
  questionSeconds: 120,
  /** The level rises by one every this many correct answers, up to 5. */
  levelUpEvery: 5,
  lifelines: LIFELINES,
} as const

export const TIME_ATTACK_RULES = {
  durationSeconds: 180,
  /** A wrong answer moves the end of the run this much earlier. */
  wrongPenaltySeconds: 5,
  levelUpEvery: 5,
  lifelines: [] as readonly Lifeline[],
} as const

/** A little latency allowance on server-side deadlines, so a just-in-time answer counts. */
export const DEADLINE_GRACE_MS = 1500

/** Chance that the phone-a-friend answer is right, by level. */
export const PHONE_FRIEND_ACCURACY: Record<Level, number> = { 1: 0.95, 2: 0.85, 3: 0.7, 4: 0.55, 5: 0.45 }

/** Share of the audience that reliably knows the answer, by level; the rest votes at random. */
export const AUDIENCE_KNOWLEDGE: Record<Level, number> = { 1: 0.75, 2: 0.6, 3: 0.45, 4: 0.32, 5: 0.22 }

export const BADGE_IDS = [
  'firstSteps',
  'safeHaven',
  'halfWay',
  'millionaire',
  'purist',
  'smartExit',
  'quickThinker',
  'marathon10',
  'marathon25',
  'marathon50',
  'marathon100',
  'timeAttack15',
  'timeAttack30',
  'polyglot3',
  'polyglot10',
  'streak3',
  'streak7',
  'offlineHero',
  'savedByAFriend',
  'categoryMaster',
] as const
export type BadgeId = (typeof BADGE_IDS)[number]

/** Badges only the server may award — they come from ranked runs it refereed. */
export const SERVER_BADGES: readonly BadgeId[] = [
  'marathon10',
  'marathon25',
  'marathon50',
  'marathon100',
  'timeAttack15',
  'timeAttack30',
]

export const isCategory = (value: unknown): value is Category => CATEGORIES.includes(value as Category)
export const isLifeline = (value: unknown): value is Lifeline => LIFELINES.includes(value as Lifeline)
export const isRankedMode = (value: unknown): value is RankedMode => RANKED_MODES.includes(value as RankedMode)
export const isBadgeId = (value: unknown): value is BadgeId => BADGE_IDS.includes(value as BadgeId)
export const isLevel = (value: unknown): value is Level => LEVELS.includes(value as Level)

/** Marathon / Time Attack: level from the number of correct answers so far. */
export const levelForCorrectCount = (correctCount: number, levelUpEvery: number): Level =>
  Math.min(5, 1 + Math.floor(correctCount / levelUpEvery)) as Level
