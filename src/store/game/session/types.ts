import type { FriendAnswer } from '@interfaces/entities'
import { StateCommonProps } from '@interfaces/store'
import type { BadgeId, Category, GameMode, Level, Lifeline } from '@constants/game'
import type { GameSettings } from '@helpers/game/settings'
import type { QuestionSource } from '@helpers/offline/questionSource'

/**
 * idle → loading → asking ⇄ selected → locked → revealed → transition → asking … → ended
 *
 * `selected` exists only in Classic, where the show's "Is that your final answer?" step
 * applies; Marathon and Time Attack lock on the first tap. `switching` is Switch the
 * Question's interlude: asking → switching → asking (a new question).
 */
export type GamePhase = 'idle' | 'loading' | 'asking' | 'selected' | 'locked' | 'revealed' | 'transition' | 'switching' | 'ended'

/**
 * Switch the Question's interlude: the player says which answer they would have given to the
 * discarded question, sees whether it was right — never scored — and only then gets the new one.
 */
export type SwitchPreview =
  | { status: 'choosing' }
  | { status: 'revealed'; correct: boolean; correctIndex: number }
  | null

export type ActiveQuestion = {
  id: string
  text: string
  options: string[]
  category: Category
  level: Level
  /** Shown indexes taken off the board by 50:50. */
  removed: number[]
  fallback: boolean
  /** Known up front in unranked games; in ranked runs only once the server reveals it. */
  correctIndex: number | null
  explanation: string | null
}

export type LifelineOverlay =
  | { type: 'askAudience'; votes: number[] }
  | { type: 'phoneAFriend'; status: 'calling' }
  | { type: 'phoneAFriend'; status: 'answered'; answer: FriendAnswer }
  | null

export type GameOutcome = 'won' | 'walked' | 'lost' | 'timeout' | 'ended'

export type GameEnd = {
  outcome: GameOutcome
  /** Classic winnings in USD. */
  winnings: number
  /** Marathon / Time Attack: correct answers. */
  score: number
  newBadges: BadgeId[]
  isPersonalBest: boolean
  /** Ranked runs: where the run landed on the board, when the server knows. */
  rank: number | null
}

export type StartConfig = {
  mode: GameMode
  locale: string
  /** Classic's custom settings; Marathon and Time Attack always play the standard rules, ranked. */
  settings: GameSettings
}

export type GameSessionState = StateCommonProps & {
  mode: GameMode
  /** Marathon and Time Attack: refereed by the server (always, for those modes). */
  ranked: boolean
  locale: string
  settings: GameSettings | null
  phase: GamePhase
  question: ActiveQuestion | null
  /** Classic: the stage being played (1-15). Marathon / Time Attack: the question number. */
  stage: number
  correctCount: number
  selectedIndex: number | null
  revealedCorrectIndex: number | null
  lastAnswerCorrect: boolean | null
  lifelinesAllowed: Lifeline[]
  lifelinesUsed: Lifeline[]
  busyLifeline: Lifeline | null
  overlay: LifelineOverlay
  switchPreview: SwitchPreview
  /** Epoch ms on this device's clock; null = no limit. */
  questionDeadline: number | null
  /** Time Attack: when the whole run ends. */
  runEndsAt: number | null
  /** Bumped on every Time Attack penalty, so the UI can flash "−5s". */
  penaltyCount: number
  runId: string | null
  source: QuestionSource
  offline: boolean
  end: GameEnd | null
}

export type GameSessionActions = {
  startGame: (config: StartConfig) => Promise<void>
  selectOption: (index: number) => void
  cancelSelection: () => void
  confirmAnswer: () => Promise<void>
  useLifeline: (lifeline: Lifeline) => Promise<void>
  /** During the Switch interlude: the answer the player would have given, or `null` to skip. */
  previewSwitchAnswer: (index: number | null) => Promise<void>
  closeOverlay: () => void
  walkAway: () => Promise<void>
  timeUp: () => Promise<void>
  quitGame: () => void
}
