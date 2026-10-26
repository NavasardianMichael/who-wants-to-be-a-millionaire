import { useTranslations } from 'next-intl'
import { cn } from '@helpers/cn'
import { AppLink } from '@components/ui/bare/AppLink'
import { Emblem } from './Emblem'

/**
 * Emblem + the translated wordmark, linking home. The two lines are their own keys: word order
 * and spacing differ by language, so the name cannot be split on a space. Hidden on the
 * narrowest phones.
 */
export const Logo = ({ className }: { className?: string }) => {
  const t = useTranslations('Common')
  return (
    <AppLink href='/' className={cn('group flex items-center gap-2.5', className)} aria-label={t('appName')}>
      <Emblem className='size-10 transition-transform duration-500 group-hover:rotate-[20deg]' />
      <span aria-hidden className='hidden flex-col leading-none min-[380px]:flex'>
        <span className='font-display text-[1.05rem] font-black tracking-wider text-gold-gradient uppercase'>
          {t('wordmarkTop')}
        </span>
        <span className='font-display text-[0.62rem] font-bold tracking-[0.42em] text-spot-300 uppercase'>
          {t('wordmarkBottom')}
        </span>
      </span>
    </AppLink>
  )
}
