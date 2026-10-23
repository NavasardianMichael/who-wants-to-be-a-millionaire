'use client'

import { useSyncExternalStore } from 'react'
import { Download } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { trackEvent } from '@helpers/analytics'
import { isInstalledApp, isInWebView } from '@helpers/device'
import { getInstallPrompt, getServerInstallPrompt, promptInstall, subscribeToInstallPrompt } from '@helpers/installPrompt'
import { IconButton } from '@components/ui/IconButton'

/**
 * Shown only when the browser has offered an install (`beforeinstallprompt`), the app is not
 * already installed, and the page is not inside an in-app browser. iOS never fires the
 * event — `InstallHint` explains Add to Home Screen there instead.
 */
export const InstallButton = ({ withLabel }: { withLabel?: boolean }) => {
  const installPrompt = useSyncExternalStore(subscribeToInstallPrompt, getInstallPrompt, getServerInstallPrompt)
  const t = useTranslations('Pwa')

  if (!installPrompt || isInstalledApp() || isInWebView()) return null

  const onClick = async () => {
    trackEvent('pwa_prompt_shown', { source: withLabel ? 'settings' : 'header' })
    if (await promptInstall()) trackEvent('pwa_installed')
  }

  if (withLabel) {
    return (
      <button
        type='button'
        onClick={onClick}
        className='inline-flex min-h-12 items-center gap-2 rounded-full bg-gold-400 px-6 font-display font-bold text-studio-950 shadow-glow-gold'
      >
        <Download aria-hidden className='size-5' />
        {t('install')}
      </button>
    )
  }

  return <IconButton tone='gold' label={t('install')} icon={<Download className='size-5' />} onClick={onClick} className='animate-pop' />
}
