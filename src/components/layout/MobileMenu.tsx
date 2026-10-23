'use client'

import { useState } from 'react'
import { Award, BookOpen, Clock, Grid3x3, Infinity as InfinityIcon, type LucideIcon, Settings, Trophy, User } from 'lucide-react'
import { Menu } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useAuthStore } from '@store/auth/store'
import { usePathname } from '@i18n/navigation'
import { ROUTES } from '@constants/routes'
import { cn } from '@helpers/cn'
import { AppLink } from '@components/ui/bare/AppLink'
import { Avatar } from '@components/ui/bare/Avatar'
import { Dialog } from '@components/ui/Dialog'
import { IconButton } from '@components/ui/IconButton'
import { isActivePath } from './DesktopNav'
import { GoogleSignInButton } from './GoogleSignInButton'

const ITEMS: { labelKey: string; href: string; icon: LucideIcon }[] = [
  { labelKey: 'classic', href: ROUTES.play, icon: Trophy },
  { labelKey: 'marathon', href: ROUTES.marathon, icon: InfinityIcon },
  { labelKey: 'timeAttack', href: ROUTES.timeAttack, icon: Clock },
  { labelKey: 'leaderboard', href: ROUTES.leaderboard, icon: Award },
  { labelKey: 'categories', href: ROUTES.categories, icon: Grid3x3 },
  { labelKey: 'badges', href: ROUTES.badges, icon: Award },
  { labelKey: 'rules', href: ROUTES.rules, icon: BookOpen },
  { labelKey: 'settings', href: ROUTES.settings, icon: Settings },
]

/** Everything the desktop header shows, in a drawer — below `lg` only. */
export const MobileMenu = () => {
  const [open, setOpen] = useState(false)
  const t = useTranslations()
  const pathname = usePathname()
  const user = useAuthStore.use.user()
  const googleAvailable = useAuthStore.use.googleAvailable()

  // Following a link closes the drawer.
  const close = () => setOpen(false)

  return (
    <div className='lg:hidden'>
      <IconButton label={t('Common.openMenu')} icon={<Menu className='size-5' />} onClick={() => setOpen(true)} aria-expanded={open} />
      <Dialog open={open} onClose={() => setOpen(false)} title={t('Common.menu')} variant='drawer'>
        <nav aria-label={t('Nav.main')}>
          <ul className='flex flex-col gap-1'>
            {ITEMS.map(({ labelKey, href, icon: Icon }) => {
              const active = isActivePath(pathname, href)
              return (
                <li key={href}>
                  <AppLink
                    href={href}
                    onClick={close}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex min-h-12 items-center gap-3 rounded-xl px-3 font-semibold transition-colors',
                      active ? 'bg-gold-400/10 text-gold-200' : 'text-ivory hover:bg-white/5'
                    )}
                  >
                    <Icon aria-hidden className='size-5 text-spot-300' />
                    {t(`Nav.${labelKey}`)}
                  </AppLink>
                </li>
              )
            })}
          </ul>
        </nav>
        <div className='mt-6 border-t border-spot-300/10 pt-6'>
          {user ? (
            <AppLink href={ROUTES.profile} onClick={close} className='flex items-center gap-3 rounded-xl p-2 hover:bg-white/5'>
              <Avatar name={user.displayName} url={user.avatarUrl} />
              <span className='min-w-0'>
                <span className='block truncate font-semibold'>{user.displayName}</span>
                <span className='flex items-center gap-1 text-body-sm text-mist'>
                  <User aria-hidden className='size-3.5' />
                  {t('Nav.profile')}
                </span>
              </span>
            </AppLink>
          ) : (
            googleAvailable && <GoogleSignInButton className='w-full' />
          )}
        </div>
      </Dialog>
    </div>
  )
}
