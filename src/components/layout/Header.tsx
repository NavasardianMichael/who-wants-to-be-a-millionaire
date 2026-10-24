import { Settings } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { ROUTES } from '@constants/routes'
import { Logo } from '@components/brand/Logo'
import { InstallButton } from '@components/pwa/InstallButton'
import { IconLink } from '@components/ui/IconLink'
import { AccountButton } from './AccountButton'
import { DesktopNav } from './DesktopNav'
import { LanguageSwitcher } from './LanguageSwitcher'
import { MobileMenu } from './MobileMenu'
import { SoundToggle } from './SoundToggle'

/**
 * Sticky, frosted purple bar with a lit hairline underneath. Desktop shows the nav inline;
 * below `lg` it moves into the menu drawer.
 */
export const Header = async () => {
  const t = await getTranslations('Nav')
  return (
  <header className='sticky top-0 z-40 bg-studio-950/75 pt-safe backdrop-blur-xl backdrop-saturate-150'>
    <div className='container-page flex h-header items-center gap-3'>
      <Logo className='me-auto shrink-0 lg:me-4' />
      <DesktopNav />
      <div className='flex shrink-0 items-center gap-2'>
        <InstallButton />
        <SoundToggle />
        <IconLink href={ROUTES.settings} label={t('settings')} icon={<Settings aria-hidden className='size-5' />} className='hidden sm:inline-flex' />
        <LanguageSwitcher />
        <AccountButton />
        <MobileMenu />
      </div>
    </div>
    <div aria-hidden className='h-px bg-[linear-gradient(90deg,transparent,var(--color-magenta-500)_25%,var(--color-gold-300)_50%,var(--color-magenta-500)_75%,transparent)] opacity-60' />
  </header>
  )
}
