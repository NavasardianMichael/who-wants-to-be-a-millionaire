'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { leaveReason, useLeaveGuardStore } from '@store/navigation/guard/store'
import { Button } from '@components/ui/Button'
import { Dialog } from '@components/ui/Dialog'

type Pending = { proceed: () => void }

/** Our marker on the extra history entry that catches the back button. Next's own state is kept beside it. */
const SENTINEL = '__leaveGuard'

const pushSentinel = () => window.history.pushState({ ...window.history.state, [SENTINEL]: true }, '', window.location.href)

/**
 * Enforces `useLeaveGuard` (regionify's unsaved-changes guard, rebuilt for the App Router,
 * which has no navigation blocker):
 *
 * - **closing the tab, reloading, leaving the site** — `beforeunload`, so the browser shows
 *   its own dialog (browsers no longer allow custom text there);
 * - **an internal link** — a capture-phase click listener runs before Next's `Link` handler,
 *   holds the navigation and asks; "leave" replays the click with the guard bypassed;
 * - **the back button** — a sentinel history entry on top of the page: going back lands on
 *   the page itself, which is put back and the question asked; "leave" goes back past both.
 */
export const LeaveGuard = () => {
  const t = useTranslations()
  const guards = useLeaveGuardStore.use.guards()
  const reason = leaveReason(guards)
  const active = reason !== null
  const [pending, setPending] = useState<Pending | null>(null)
  // Set while a confirmed navigation is replayed, so the guard lets it through.
  const bypass = useRef(false)

  useEffect(() => {
    if (!active) return
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      // Older browsers still need `returnValue` to show the dialog.
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [active])

  useEffect(() => {
    if (!active) return
    const onClick = (event: MouseEvent) => {
      if (bypass.current || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const anchor = (event.target as Element | null)?.closest('a')
      if (!anchor?.href || anchor.target === '_blank' || anchor.hasAttribute('download')) return
      const url = new URL(anchor.href, window.location.href)
      // Another origin unloads the page, where `beforeunload` asks; the same page (or a hash) loses nothing.
      if (url.origin !== window.location.origin) return
      if (url.pathname === window.location.pathname && url.search === window.location.search) return
      event.preventDefault()
      event.stopPropagation()
      setPending({
        proceed: () => {
          bypass.current = true
          anchor.click()
          bypass.current = false
        },
      })
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [active])

  useEffect(() => {
    if (!active) return
    pushSentinel()
    const onPopState = () => {
      if (bypass.current) {
        bypass.current = false
        return
      }
      pushSentinel()
      setPending({
        proceed: () => {
          bypass.current = true
          window.history.go(-2)
        },
      })
    }
    window.addEventListener('popstate', onPopState)
    return () => {
      window.removeEventListener('popstate', onPopState)
      // Nothing to guard any more (the game ended, the form was sent): drop the sentinel so
      // the back button needs one press again. After a navigation it is no longer on top.
      if (window.history.state?.[SENTINEL] && !bypass.current) {
        bypass.current = true
        window.history.back()
      }
    }
  }, [active])

  const game = reason === 'game' || reason === 'rankedGame'
  const close = () => setPending(null)

  return (
    <Dialog
      open={pending !== null}
      onClose={close}
      title={game ? t('Game.leaveTitle') : t('Common.unsavedTitle')}
      description={reason === 'rankedGame' ? t('Game.leaveRankedBody') : game ? t('Game.leaveBody') : t('Common.unsavedBody')}
      footer={
        <>
          <Button variant='ghost' onClick={close}>
            {game ? t('Game.keepPlaying') : t('Common.stay')}
          </Button>
          <Button
            variant='danger'
            onClick={() => {
              const proceed = pending?.proceed
              close()
              proceed?.()
            }}
          >
            {game ? t('Game.leave') : t('Common.leave')}
          </Button>
        </>
      }
    />
  )
}
