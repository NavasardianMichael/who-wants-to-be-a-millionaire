/** Why leaving would cost something: a game in progress, or a form with unsaved input. */
export type LeaveReason = 'game' | 'rankedGame' | 'unsaved'

export type LeaveGuardState = {
  /** Every active guard by its owner's id; the page is guarded while any exist. */
  guards: Record<string, LeaveReason>
  /** The open "leave this page?" question; `resolve` gets the player's answer. */
  question: { resolve: (leave: boolean) => void } | null
  /** The player agreed to leave: let the navigation through without asking again. */
  leaving: boolean
}

export type LeaveGuardActions = {
  setGuard: (id: string, reason: LeaveReason | null) => void
  /** Resolves true at once while nothing is guarded, otherwise once the player answers. */
  ask: () => Promise<boolean>
  answer: (leave: boolean) => void
}
