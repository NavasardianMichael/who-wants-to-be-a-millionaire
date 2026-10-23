'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { syncBadgesAPI } from '@api/badges/main'
import { useAudioStore } from '@store/audio/store'
import { useAuthStore } from '@store/auth/store'
import { useSettingsStore } from '@store/settings/store'
import { toast } from '@store/toast/store'
import { usePathname, useRouter } from '@i18n/navigation'
import { mergeLocalBadges, readLocalBadges } from '@helpers/game/progress'
import { flushOutbox } from '@helpers/offline/outbox'
import { reportError } from '@helpers/reportError'

/**
 * App-wide side effects, mounted once:
 * - hydrate persisted settings and audio preferences (the server render assumes defaults);
 * - resolve the session, and greet or explain the outcome of a Google sign-in redirect;
 * - once signed in, merge device badges into the account and flush the offline outbox;
 * - flush again whenever the connection comes back.
 */
export const AppEffects = () => {
  const hydrateSettings = useSettingsStore.use.hydrateSettings()
  const hydrateAudio = useAudioStore.use.hydrateAudio()
  const resolveSession = useAuthStore.use.resolveSession()
  const user = useAuthStore.use.user()
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations()

  useEffect(() => {
    hydrateSettings()
    hydrateAudio()
    void resolveSession()
  }, [hydrateSettings, hydrateAudio, resolveSession])

  // The API redirects back with `?signedIn=1` or `?authError=<code>`; consume and clean the URL.
  useEffect(() => {
    const signedIn = searchParams.get('signedIn')
    const authError = searchParams.get('authError')
    if (!signedIn && !authError) return

    if (authError) {
      const key = `Auth.errors.${authError}`
      toast(t.has(key) ? t(key) : t('Errors.generic'), 'error')
    }
    const params = new URLSearchParams(searchParams.toString())
    params.delete('signedIn')
    params.delete('authError')
    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname)
  }, [searchParams, router, pathname, t])

  useEffect(() => {
    if (!user) return
    if (searchParams.get('signedIn')) toast(t('Auth.signedIn', { name: user.displayName }), 'success')

    void flushOutbox()
    syncBadgesAPI({ badgeIds: readLocalBadges().map(({ badgeId }) => badgeId) })
      .then(({ badges }) => mergeLocalBadges(badges.map(({ badgeId }) => badgeId)))
      .catch((error: unknown) => reportError(error, 'badges:sync', { silent: true }))
    // `searchParams` is read once per sign-in, not tracked.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  useEffect(() => {
    const onOnline = () => {
      toast(t('Common.backOnline'), 'success')
      if (useAuthStore.getState().user) void flushOutbox()
    }
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [t])

  return null
}
