import { useTranslations } from 'next-intl'
import { cn } from '@helpers/cn'
import { AppLink } from '@components/ui/bare/AppLink'
import { Emblem } from './Emblem'

/** Emblem + wordmark, linking home. The wordmark hides on the narrowest phones. */
export const Logo = ({ className }: { className?: string }) => {
  const t = useTranslations('Common')
  return (
    <AppLink href='/' className={cn('group flex items-center gap-2.5', className)} aria-label={t('appName')}>
      <Emblem className='size-10 transition-transform duration-500 group-hover:rotate-[20deg]' />
      <span aria-hidden className='hidden flex-col leading-none min-[380px]:flex'>
        <span className='font-display text-[1.05rem] font-black tracking-wider text-gold-gradient uppercase'>
          {t('appName').split(' ')[0]}
        </span>
        <span className='font-display text-[0.62rem] font-bold tracking-[0.42em] text-spot-300 uppercase'>
          {t('appName').split(' ').slice(1).join(' ')}
        </span>
      </span>
    </AppLink>
  )
}
