'use client'

import { useEffect, useState } from 'react'
import { useFormatter, useTranslations } from 'next-intl'
import { getMyBadgesAPI } from '@api/badges/main'
import { useAuthStore } from '@store/auth/store'
import type { EarnedBadge } from '@interfaces/entities'
import { BADGE_IDS, type BadgeId } from '@constants/game'
import { cn } from '@helpers/cn'
import { readLocalBadges } from '@helpers/game/progress'
import { reportError } from '@helpers/reportError'
import { BadgeMedal } from './BadgeMedal'

/**
 * Every badge, earned or locked. The server renders them all locked (that is the catalogue
 * crawlers index); after hydration the device's badges — merged with the account's when
 * signed in — light up.
 */
export const BadgeCollection = () => {
  const t = useTranslations('Badges')
  const format = useFormatter()
  const user = useAuthStore.use.user()
  const [earned, setEarned] = useState<Map<BadgeId, string>>(new Map())

  useEffect(() => {
    const merge = (badges: EarnedBadge[]) =>
      setEarned((current) => {
        const next = new Map(current)
        for (const { badgeId, earnedAt } of badges) if (!next.has(badgeId)) next.set(badgeId, earnedAt)
        return next
      })
    merge(readLocalBadges())
    if (user) getMyBadgesAPI().then(merge).catch((error: unknown) => reportError(error, 'badges:mine', { silent: true }))
  }, [user])

  return (
    <>
      <p className='mb-6 text-mist' aria-live='polite'>
        {earned.size ? t('subtitle', { earned: earned.size, total: BADGE_IDS.length }) : t('subtitleGuest', { total: BADGE_IDS.length })}
      </p>
      <ul className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {BADGE_IDS.map((badgeId) => {
          const earnedAt = earned.get(badgeId)
          return (
            <li key={badgeId} className={cn('panel flex items-center gap-4 p-4', earnedAt && 'border-gold-400/50')}>
              <BadgeMedal badgeId={badgeId} earned={Boolean(earnedAt)} />
              <div className='min-w-0'>
                <h2 className={cn('font-display font-bold', earnedAt ? 'text-gold-200' : 'text-ivory')}>{t(`items.${badgeId}.name`)}</h2>
                <p className='text-body-sm text-mist'>{t(`items.${badgeId}.description`)}</p>
                <p className='mt-1 text-caption font-semibold text-spot-300'>
                  {earnedAt ? t('earnedOn', { date: format.dateTime(new Date(earnedAt), { dateStyle: 'medium' }) }) : t('locked')}
                </p>
              </div>
            </li>
          )
        })}
      </ul>
    </>
  )
}
