import { Logo } from '@components/brand/Logo'
import { InstallButton } from '@components/pwa/InstallButton'
import { AccountButton } from './AccountButton'
import { DesktopNav } from './DesktopNav'
import { LanguageSwitcher } from './LanguageSwitcher'
import { MobileMenu } from './MobileMenu'
import { SoundToggle } from './SoundToggle'

/** Sticky, translucent studio bar. Desktop shows the nav inline; below `lg` it moves into the menu drawer. */
export const Header = () => (
  <header className='sticky top-0 z-40 border-b border-spot-300/10 bg-studio-950/70 pt-safe backdrop-blur-xl'>
    <div className='container-page flex h-header items-center gap-3'>
      <Logo className='me-auto lg:me-6' />
      <DesktopNav />
      <div className='flex items-center gap-2'>
        <InstallButton />
        <SoundToggle />
        <LanguageSwitcher />
        <AccountButton />
        <MobileMenu />
      </div>
    </div>
  </header>
)
