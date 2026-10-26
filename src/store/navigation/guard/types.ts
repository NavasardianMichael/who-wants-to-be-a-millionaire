/** Why leaving would cost something: a game in progress, or a form with unsaved input. */
export type LeaveReason = 'game' | 'rankedGame' | 'unsaved'

export type LeaveGuardState = {
  /** Every active guard by its owner's id; the page is guarded while any exist. */
  guards: Record<string, LeaveReason>
}

export type LeaveGuardActions = {
  setGuard: (id: string, reason: LeaveReason | null) => void
}
