'use client'

import { useEffect } from 'react'
import { LogOut } from 'lucide-react'
import { useFormatter, useLocale, useTranslations } from 'next-intl'
import { useAuthStore } from '@store/auth/store'
import { useProfileStore } from '@store/profile/single/store'
import { toast } from '@store/toast/store'
import { BADGE_IDS, RANKED_MODES, STAGES_COUNT } from '@constants/game'
import { ROUTES } from '@constants/routes'
import { formatMoney } from '@helpers/money'
import { BadgeMedal } from '@components/badges/BadgeMedal'
import { GoogleSignInButton } from '@components/layout/GoogleSignInButton'
import { AppLink } from '@components/ui/bare/AppLink'
import { Skeleton } from '@components/ui/bare/Skeleton'
import { Button } from '@components/ui/Button'
import { ErrorAlert } from '@components/ui/ErrorAlert'
import { Card } from '@components/ui/layout/Card'
import { AvatarEditor } from './AvatarEditor'
import { DisplayNameForm } from './DisplayNameForm'

const Stat = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
  <Card className='flex flex-col gap-1'>
    <span className='text-caption font-bold tracking-widest text-spot-300 uppercase'>{label}</span>
    <span className='font-display text-h2 font-black text-gold-gradient tabular'>{value}</span>
    {sub && <span className='text-body-sm text-mist'>{sub}</span>}
  </Card>
)

export const ProfileView = () => {
  const t = useTranslations()
  const locale = useLocale()
  const format = useFormatter()
  const user = useAuthStore.use.user()
  const isResolved = useAuthStore.use.isResolved()
  const googleAvailable = useAuthStore.use.googleAvailable()
  const logout = useAuthStore.use.logout()
  const profile = useProfileStore.use.profile()
  const history = useProfileStore.use.history()
  const error = useProfileStore.use.error()
  const getProfile = useProfileStore.use.getProfile()

  useEffect(() => {
    if (user) void getProfile()
  }, [user?.id, getProfile]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!isResolved) {
    return (
      <div className='grid gap-4 md:grid-cols-[18rem_1fr]'>
        <Skeleton className='h-80' />
        <Skeleton className='h-80' />
      </div>
    )
  }

  if (!user) {
    return (
      <Card tone='gold' className='mx-auto flex max-w-lg flex-col items-center gap-4 text-center'>
        <h2 className='text-h2 font-black text-gold-gradient'>{t('Profile.signInTitle')}</h2>
        <p className='text-mist'>{t('Profile.signInBody')}</p>
        {googleAvailable && <GoogleSignInButton />}
      </Card>
    )
  }

  return (
    <div className='grid items-start gap-6 md:grid-cols-[18rem_1fr]'>
      <Card className='flex flex-col items-center gap-5 text-center'>
        <AvatarEditor user={user} />
        <DisplayNameForm key={user.displayName} initial={user.displayName} />
        <p className='text-caption text-mist'>
          {t('Profile.memberSince', { date: format.dateTime(new Date(user.createdAt), { dateStyle: 'long' }) })}
        </p>
        <Button
          variant='ghost'
          size='sm'
          onClick={async () => {
            await logout()
            toast(t('Auth.signedOut'))
          }}
          icon={<LogOut aria-hidden className='size-4 rtl:-scale-x-100' />}
        >
          {t('Common.signOut')}
        </Button>
      </Card>

      <div className='flex flex-col gap-6'>
        {Boolean(error) && <ErrorAlert error={error} onRetry={() => void getProfile()} />}

        <section aria-labelledby='stats-title' className='flex flex-col gap-3'>
          <h2 id='stats-title' className='text-h3 font-bold text-gold-200'>
            {t('Profile.statsTitle')}
          </h2>
          {profile ? (
            <div className='grid gap-3 sm:grid-cols-2'>
              <Stat label={t('Profile.classicBest')} value={formatMoney(profile.classic.bestWinnings, locale)} />
              <Stat label={t('Profile.gamesPlayed')} value={String(profile.classic.gamesPlayed)} />
              {RANKED_MODES.map((mode) => {
                const summary = profile.ranked[mode]
                return (
                  <Stat
                    key={mode}
                    label={t('Profile.rankedBest', { mode: t(`Modes.${mode}.name`) })}
                    value={summary ? String(summary.score) : '—'}
                    sub={summary ? t('Profile.rankLabel', { rank: summary.rank }) : t('Profile.noRank')}
                  />
                )
              })}
            </div>
          ) : (
            <div className='grid gap-3 sm:grid-cols-2'>
              {[0, 1, 2, 3].map((index) => (
                <Skeleton key={index} className='h-28' />
              ))}
            </div>
          )}
        </section>

        <section aria-labelledby='badges-title' className='flex flex-col gap-3'>
          <h2 id='badges-title' className='text-h3 font-bold text-gold-200'>
            <AppLink href={ROUTES.badges} className='hover:underline'>
              {t('Profile.badgesTitle')}
            </AppLink>
          </h2>
          {profile && profile.badges.length > 0 ? (
            <ul className='flex flex-wrap gap-4'>
              {profile.badges.map(({ badgeId }) => (
                <li key={badgeId} className='flex w-24 flex-col items-center gap-1.5 text-center'>
                  <BadgeMedal badgeId={badgeId} earned />
                  <span className='text-caption font-semibold'>{t(`Badges.items.${badgeId}.name`)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className='text-body-sm text-mist'>{t('Badges.subtitleGuest', { total: BADGE_IDS.length })}</p>
          )}
        </section>

        <section aria-labelledby='history-title' className='flex flex-col gap-3'>
          <h2 id='history-title' className='text-h3 font-bold text-gold-200'>
            {t('Profile.historyTitle')}
          </h2>
          {history?.recent.length ? (
            <ul className='panel divide-y divide-spot-300/10'>
              {history.recent.map((game) => (
                <li key={game.clientId} className='flex items-center justify-between gap-3 px-4 py-3'>
                  <span className='flex flex-col'>
                    <span className='font-semibold'>{t('Game.questionOf', { current: game.reachedStage, total: STAGES_COUNT })}</span>
                    <span className='text-caption text-mist'>{format.dateTime(new Date(game.playedAt), { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </span>
                  <span className='font-display font-black text-gold-300 tabular'>{formatMoney(game.winnings, locale)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className='text-body-sm text-mist'>{t('Profile.noHistory')}</p>
          )}
        </section>
      </div>
    </div>
  )
}
