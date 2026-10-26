'use client'

import { useEffect, useRef, useState } from 'react'
import { animate, useReducedMotion } from 'motion/react'
import { formatMoney } from '@helpers/money'

/** Ticks up (or down) to `amount` like a scoreboard. Static under reduced motion. */
export const MoneyCounter = ({ amount, locale, className }: { amount: number; locale: string; className?: string }) => {
  const [animated, setAnimated] = useState(amount)
  const previous = useRef(amount)
  const reduce = useReducedMotion()

  useEffect(() => {
    if (reduce) return
    const controls = animate(previous.current, amount, {
      duration: 1.1,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (value) => setAnimated(Math.round(value)),
    })
    previous.current = amount
    return () => controls.stop()
  }, [amount, reduce])

  return <span className={className}>{formatMoney(reduce ? amount : animated, locale)}</span>
}
