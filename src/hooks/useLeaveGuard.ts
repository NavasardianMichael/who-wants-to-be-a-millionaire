import { useEffect, useId } from 'react'
import { useLeaveGuardStoreBase } from '@store/navigation/guard/store'
import type { LeaveReason } from '@store/navigation/guard/types'

/**
 * Asks before the page is left while `reason` is set — a game in progress, a form with
 * unsaved input. Closing the tab or reloading gets the browser's own dialog; links and the
 * back button get ours (`LeaveGuard`). Pass `null` (or `false`) when there is nothing to lose.
 */
export const useLeaveGuard = (reason: LeaveReason | null | false) => {
  const id = useId()
  const setGuard = useLeaveGuardStoreBase((state) => state.setGuard)

  useEffect(() => {
    setGuard(id, reason || null)
    return () => setGuard(id, null)
  }, [id, reason, setGuard])
}
