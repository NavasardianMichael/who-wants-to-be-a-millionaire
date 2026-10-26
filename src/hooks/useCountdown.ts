'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Milliseconds left until `deadline` (epoch ms), re-rendering a few times a second, and
 * calling `onExpire` exactly once when it passes. `null` means no limit.
 *
 * `paused` freezes the display (e.g. while the answer is locked) without firing.
 */
export const useCountdown = (deadline: number | null, onExpire?: () => void, paused = false): number | null => {
  const [now, setNow] = useState(() => Date.now())
  const expiredFor = useRef<number | null>(null)
  const onExpireRef = useRef(onExpire)

  useEffect(() => {
    onExpireRef.current = onExpire
  }, [onExpire])

  useEffect(() => {
    if (deadline === null || paused) return
    const tick = () => {
      const current = Date.now()
      setNow(current)
      if (current >= deadline && expiredFor.current !== deadline) {
        expiredFor.current = deadline
        onExpireRef.current?.()
      }
    }
    tick()
    const timer = setInterval(tick, 200)
    return () => clearInterval(timer)
  }, [deadline, paused])

  if (deadline === null) return null
  return Math.max(0, deadline - now)
}
