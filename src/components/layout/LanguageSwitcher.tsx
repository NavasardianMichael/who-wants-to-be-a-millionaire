'use client'

import { useMemo, useState, useTransition } from 'react'
import { Check, Globe, Search } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { setLocale } from '@i18n/actions'
import { isLocale, type Locale, LOCALE_LABELS, LOCALES } from '@i18n/config'
import { usePathname, useRouter } from '@i18n/navigation'
import { cn } from '@helpers/cn'
import { Dialog } from '@components/ui/Dialog'

/**
 * Fifty languages do not fit a dropdown, so the switcher is a searchable dialog. Each
 * language is shown by its own name (an endonym) and code, so someone who cannot read the
 * current UI can still find theirs. Switching keeps the page and its query.
 */
export const LanguageSwitcher = ({ className }: { className?: string }) => {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [isPending, startTransition] = useTransition()
  const locale = useLocale()
  const t = useTranslations('Common')
  const router = useRouter()
  const pathname = usePathname()

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase()
    if (!needle) return LOCALES
    return LOCALES.filter(
      (each) => each.toLowerCase().includes(needle) || LOCALE_LABELS[each].toLocaleLowerCase().includes(needle)
    )
  }, [query])

  const choose = (next: Locale) => {
    setOpen(false)
    if (next === locale) return
    startTransition(async () => {
      await setLocale(next)
      // Read at click time rather than via useSearchParams, which would need a Suspense boundary.
      const search = window.location.search
      router.replace(`${pathname}${search}`, { locale: next })
    })
  }

  return (
    <>
      <button
        type='button'
        onClick={() => setOpen(true)}
        aria-label={t('chooseLanguage')}
        aria-busy={isPending || undefined}
        className={cn(
          'inline-flex h-11 items-center gap-1.5 rounded-full border border-spot-300/25 bg-studio-900/70 px-3 text-body-sm font-bold text-mist uppercase transition-colors hover:border-spot-300/60 hover:text-ivory',
          className
        )}
      >
        <Globe aria-hidden className='size-5' />
        <span className='hidden sm:inline'>{locale}</span>
      </button>

      <Dialog open={open} onClose={() => setOpen(false)} title={t('chooseLanguage')} variant='sheet' className='sm:max-w-2xl'>
        <label className='relative mb-4 block'>
          <span className='sr-only'>{t('chooseLanguage')}</span>
          <Search aria-hidden className='pointer-events-none absolute inset-s-3 top-1/2 size-4 -translate-y-1/2 text-mist' />
          <input
            type='search'
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder='English, Español, 日本語…'
            className='h-12 w-full rounded-full border border-spot-300/25 bg-studio-950/70 ps-10 pe-4 text-ivory placeholder:text-mist-dim focus:border-gold-300 focus:outline-none'
          />
        </label>
        <ul className='grid grid-cols-1 gap-1.5 min-[420px]:grid-cols-2 sm:grid-cols-3'>
          {filtered.map((each) => {
            const active = each === locale
            return (
              <li key={each}>
                <button
                  type='button'
                  lang={each}
                  onClick={() => choose(each)}
                  aria-current={active ? 'true' : undefined}
                  className={cn(
                    'flex min-h-11 w-full items-center gap-2 rounded-xl border px-3 text-start transition-colors',
                    active
                      ? 'border-gold-300/70 bg-gold-400/10 text-gold-200'
                      : 'border-transparent text-ivory hover:border-spot-300/30 hover:bg-white/5'
                  )}
                >
                  <span className='flex-1 truncate font-semibold'>{LOCALE_LABELS[each]}</span>
                  <span className='text-caption text-mist-dim uppercase'>{each}</span>
                  {active && <Check aria-hidden className='size-4' />}
                </button>
              </li>
            )
          })}
        </ul>
        {!filtered.length && isLocale(locale) && <p className='py-6 text-center text-mist'>—</p>}
      </Dialog>
    </>
  )
}
