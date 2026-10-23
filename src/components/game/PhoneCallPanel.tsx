'use client'

import { useEffect, useState } from 'react'
import { Phone } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useTranslations } from 'next-intl'
import type { FriendAnswer } from '@interfaces/entities'
import { OPTION_LETTERS } from '@constants/game'
import { Avatar } from '@components/ui/bare/Avatar'

type PhoneCallPanelProps =
  | { status: 'calling'; answer?: undefined; options: string[] }
  | { status: 'answered'; answer: FriendAnswer; options: string[] }

/**
 * Reveals text a few characters at a time, like someone talking. Instant under reduced
 * motion. Each call mounts a fresh panel (the overlay closes in between), so the count never
 * needs resetting.
 */
const useTypewriter = (text: string, enabled: boolean): string => {
  const [length, setLength] = useState(0)
  useEffect(() => {
    if (!enabled) return
    const timer = setInterval(() => setLength((current) => (current >= text.length ? current : current + 2)), 30)
    return () => clearInterval(timer)
  }, [text, enabled])
  return enabled ? text.slice(0, length) : text
}

/**
 * The call: a ringing phone while the line connects, then the friend's words. When the AI
 * gave no usable words (offline, quota, or a reply that named the wrong option) the friend
 * speaks a translated template that always names the suggested option.
 */
export const PhoneCallPanel = ({ status, answer, options }: PhoneCallPanelProps) => {
  const t = useTranslations('Lifelines')
  const reduce = useReducedMotion()
  const name = answer?.friendName || t('friendDefaultName')

  const message =
    answer &&
    (answer.message ??
      t(answer.confidence === 'high' ? 'friendHigh' : answer.confidence === 'medium' ? 'friendMedium' : 'friendLow', {
        letter: OPTION_LETTERS[answer.suggestedIndex]!,
        answer: options[answer.suggestedIndex] ?? '',
      }))
  const typed = useTypewriter(message ?? '', Boolean(message) && !reduce)

  return (
    <div className='flex w-full max-w-md flex-col items-center gap-4 text-center'>
      <div className='relative'>
        {status === 'calling' && (
          <>
            <span aria-hidden className='absolute inset-0 animate-ping rounded-full bg-spot-500/30' />
            <span aria-hidden className='absolute -inset-3 animate-ping rounded-full bg-spot-500/15 [animation-delay:300ms]' />
          </>
        )}
        <span className='relative flex size-16 items-center justify-center rounded-full border-2 border-spot-300 bg-studio-800 shadow-glow-spot'>
          {status === 'calling' ? (
            <Phone aria-hidden className='size-7 animate-ring text-spot-300' />
          ) : (
            <Avatar name={name} url={null} size='lg' className='size-full border-0' />
          )}
        </span>
      </div>

      {status === 'calling' ? (
        <p role='status' className='font-display font-bold tracking-wide text-spot-300'>
          {t('callingFriend')}
        </p>
      ) : (
        <motion.blockquote
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className='panel relative w-full px-5 py-4 text-start'
        >
          <p className='mb-1 text-caption font-bold tracking-widest text-gold-300 uppercase'>{t('friendSays', { name })}</p>
          {/* The full message for screen readers at once; the typewriter is visual only. */}
          <p className='sr-only' aria-live='polite'>
            {message}
          </p>
          <p aria-hidden className='min-h-12 text-body text-ivory'>
            “{typed}”
          </p>
        </motion.blockquote>
      )}
    </div>
  )
}
