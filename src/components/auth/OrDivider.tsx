import { useTranslations } from 'next-intl'

/** "— or —" between Google and the email form. */
export const OrDivider = () => {
  const t = useTranslations('Common')
  return (
    <div className='flex items-center gap-3 text-caption text-mist-dim uppercase'>
      <span aria-hidden className='h-px flex-1 bg-line-subtle' />
      {t('or')}
      <span aria-hidden className='h-px flex-1 bg-line-subtle' />
    </div>
  )
}
