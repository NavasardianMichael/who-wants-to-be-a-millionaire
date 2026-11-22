import { ArrowRight, Star } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { googlePreferredSourceUrl } from '@helpers/url'
import { GoogleMark } from '@components/brand/GoogleMark'

/**
 * "Add us as a preferred source on Google": Google's own page for this site, opened in a new
 * tab. A plain link in the show's colours rather than Google's script-drawn button.
 */
export const PreferredSourceBadge = () => {
  const t = useTranslations('Common')

  return (
    <a
      href={googlePreferredSourceUrl()}
      target='_blank'
      rel='noopener noreferrer'
      className='group inline-flex max-w-full items-center gap-3 rounded-lg border border-spot-300/20 bg-studio-950/60 py-2 ps-2 pe-4 transition-colors hover:border-gold-200/60'
    >
      <span className='relative flex size-10 shrink-0 items-center justify-center rounded-md bg-ivory'>
        <GoogleMark />
        <Star aria-hidden className='absolute -end-1.5 -top-1.5 size-4 fill-gold-200 text-gold-200' />
      </span>
      <span className='flex min-w-0 flex-col leading-tight'>
        <span className='text-caption text-mist-dim'>{t('preferredSourceEyebrow')}</span>
        <span className='text-body-sm font-semibold text-mist transition-colors group-hover:text-gold-200'>{t('preferredSource')}</span>
      </span>
      <ArrowRight aria-hidden className='size-4 shrink-0 text-mist-dim transition group-hover:translate-x-0.5 group-hover:text-gold-200 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5' />
    </a>
  )
}
