import { create } from 'zustand'
import { combine } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { appendSelectors } from '@store/appendSelectors'
import { LeaveGuardActions, LeaveGuardState, LeaveReason } from './types'

const initialState: LeaveGuardState = { guards: {}, question: null, leaving: false }

/** The reason to show when several guards are active: a game outranks a form. */
export const leaveReason = (guards: Record<string, LeaveReason>): LeaveReason | null => {
  const reasons = Object.values(guards)
  return reasons.includes('rankedGame') ? 'rankedGame' : reasons.includes('game') ? 'game' : (reasons[0] ?? null)
}

/** Registered by `useLeaveGuard`, enforced by the one `LeaveGuard` in the app shell. */
export const useLeaveGuardStoreBase = create<LeaveGuardState & LeaveGuardActions>()(
  immer(
    combine(
      initialState,
      (set, get): LeaveGuardActions => ({
        setGuard: (id, reason) => {
          const { question } = get()
          set((state) => {
            if (reason) state.guards[id] = reason
            else delete state.guards[id]
            // Nothing is guarded any more (the game ended, the page was left): start afresh.
            if (!Object.keys(state.guards).length) {
              state.leaving = false
              state.question = null
            }
          })
          // Asked while the game was still on; it has ended since, so the question is moot.
          if (question && !get().question) question.resolve(false)
        },

        ask: () => {
          const { guards, leaving, question } = get()
          if (leaving || leaveReason(guards) === null) return Promise.resolve(true)
          // Asked again while the dialog is up (a second Back): the newest question wins.
          question?.resolve(false)
          return new Promise<boolean>((resolve) => {
            set((state) => {
              state.question = { resolve }
            })
          })
        },

        answer: (leave) => {
          const { question } = get()
          set((state) => {
            state.question = null
            if (leave) state.leaving = true
          })
          question?.resolve(leave)
        },
      })
    )
  )
)

export const useLeaveGuardStore = appendSelectors(useLeaveGuardStoreBase)
