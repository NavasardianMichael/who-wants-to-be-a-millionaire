'use client'

import { useTranslations } from 'next-intl'
import { usePathname } from '@i18n/navigation'
import { PRIMARY_NAV } from '@constants/navigation'
import { cn } from '@helpers/cn'
import { AppLink } from '@components/ui/bare/AppLink'

export const isActivePath = (pathname: string, href: string): boolean =>
  href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)

export const DesktopNav = () => {
  const t = useTranslations('Nav')
  const pathname = usePathname()

  return (
    // Never wraps: a long label (some languages need two words) scrolls the row instead of breaking it.
    <nav aria-label={t('main')} className='me-auto hidden min-w-0 lg:block'>
      <ul className='flex items-center gap-1 overflow-x-auto py-1 no-scrollbar'>
        {PRIMARY_NAV.map(({ labelKey, href }) => {
          const active = isActivePath(pathname, href)
          return (
            <li key={href} className='shrink-0'>
              <AppLink
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative block rounded-control px-3 py-2 text-body-sm font-semibold whitespace-nowrap transition-colors duration-200 xl:px-4',
                  active ? 'bg-studio-700/40 text-gold-200' : 'text-mist hover:bg-white/5 hover:text-ivory'
                )}
              >
                {t(labelKey)}
                {active && (
                  <span
                    aria-hidden
                    className='absolute inset-x-3 bottom-0.5 h-0.5 bg-[linear-gradient(90deg,transparent,var(--color-gold-300),transparent)]'
                  />
                )}
              </AppLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
