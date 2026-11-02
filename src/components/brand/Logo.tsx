import { useTranslations } from 'next-intl'
import { cn } from '@helpers/cn'
import { AppLink } from '@components/ui/bare/AppLink'
import { Emblem } from './Emblem'

/** Emblem + the translated name, linking home. The name is hidden on the narrowest phones. */
export const Logo = ({ className }: { className?: string }) => {
  const t = useTranslations('Common')
  return (
    <AppLink href='/' className={cn('group flex items-center gap-2.5', className)} aria-label={t('appName')}>
      {/* Only the ring of rays turns, two ticks' worth: a tilted "M" reads as broken. */}
      <Emblem className='size-10 [&_.emblem-rays]:origin-center [&_.emblem-rays]:transition-[rotate] [&_.emblem-rays]:duration-700 [&_.emblem-rays]:ease-show [&_.emblem-rays]:[transform-box:view-box] group-hover:[&_.emblem-rays]:rotate-45' />
      <span aria-hidden className='hidden font-display text-[1.2rem] leading-none font-black tracking-wider text-gold-gradient uppercase min-[380px]:block'>
        {t('appName')}
      </span>
    </AppLink>
  )
}
