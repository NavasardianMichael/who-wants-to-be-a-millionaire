import { create } from 'zustand'
import { combine } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { appendSelectors } from '@store/appendSelectors'
import { LeaveGuardActions, LeaveGuardState, LeaveReason } from './types'

const initialState: LeaveGuardState = { guards: {} }

/** Registered by `useLeaveGuard`, enforced by the one `LeaveGuard` in the app shell. */
export const useLeaveGuardStoreBase = create<LeaveGuardState & LeaveGuardActions>()(
  immer(
    combine(
      initialState,
      (set): LeaveGuardActions => ({
        setGuard: (id, reason) => {
          set((state) => {
            if (reason) state.guards[id] = reason
            else delete state.guards[id]
          })
        },
      })
    )
  )
)

export const useLeaveGuardStore = appendSelectors(useLeaveGuardStoreBase)

/** The reason to show when several guards are active: a game outranks a form. */
export const leaveReason = (guards: Record<string, LeaveReason>): LeaveReason | null => {
  const reasons = Object.values(guards)
  return reasons.includes('rankedGame') ? 'rankedGame' : reasons.includes('game') ? 'game' : (reasons[0] ?? null)
}
