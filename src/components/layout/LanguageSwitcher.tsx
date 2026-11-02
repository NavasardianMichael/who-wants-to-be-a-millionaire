'use client'

import { useMemo, useRef, useState, useTransition } from 'react'
import { Button, Empty, Input, type InputRef, Tooltip } from 'antd'
import { Check, Globe, Search } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { confirmLeave } from '@hooks/useLeaveGuard'
import { setLocale } from '@i18n/actions'
import { isLocale, type Locale, LOCALE_LABELS, LOCALES, localeShortLabel } from '@i18n/config'
import { foldForSearch, languageSearchText } from '@i18n/languageNames'
import { usePathname, useRouter } from '@i18n/navigation'
import { cn } from '@helpers/cn'
import { Dialog } from '@components/ui/Dialog'

/**
 * Eighty languages do not fit a dropdown, so the switcher is a searchable dialog. Each
 * language is shown by its own name (an endonym) and code, so someone who cannot read the
 * current UI can still find theirs; the search also knows its English name and its name in
 * the current UI. Switching keeps the page and its query.
 */
export const LanguageSwitcher = ({ className, withLabel }: { className?: string; withLabel?: boolean }) => {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const searchRef = useRef<InputRef>(null)
  const [isPending, startTransition] = useTransition()
  const locale = useLocale()
  const t = useTranslations('Common')
  const router = useRouter()
  const pathname = usePathname()

  const searchIndex = useMemo(
    () => LOCALES.map((each) => [each, languageSearchText(each, isLocale(locale) ? locale : 'en')] as const),
    [locale]
  )

  const filtered = useMemo(() => {
    const needle = foldForSearch(query)
    if (!needle) return LOCALES
    return searchIndex.filter(([, text]) => text.includes(needle)).map(([each]) => each)
  }, [query, searchIndex])

  const choose = async (next: Locale) => {
    setOpen(false)
    // Another language reloads the page, which would end a game in progress.
    if (next === locale || !(await confirmLeave())) return
    startTransition(async () => {
      await setLocale(next)
      // Read at click time rather than via useSearchParams, which would need a Suspense boundary.
      const search = window.location.search
      router.replace(`${pathname}${search}`, { locale: next })
    })
  }

  return (
    <>
      <Tooltip title={t('chooseLanguage')} mouseEnterDelay={0.4}>
        <Button
          size='large'
          onClick={() => setOpen(true)}
          aria-label={t('chooseLanguage')}
          aria-busy={isPending || undefined}
          loading={isPending}
          icon={<Globe aria-hidden className='size-5' />}
          className={cn('h-11 border-line-strong bg-studio-900/70 px-3 font-bold text-mist uppercase hover:text-ivory', className)}
        >
          {withLabel && isLocale(locale) ? (
            <span className='normal-case'>{LOCALE_LABELS[locale]}</span>
          ) : (
            <span lang={locale} className='hidden sm:inline'>
              {isLocale(locale) ? localeShortLabel(locale) : locale}
            </span>
          )}
        </Button>
      </Tooltip>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={t('chooseLanguage')}
        variant='sheet'
        size='lg'
        initialFocus={searchRef}
      >
        <Input
          ref={searchRef}
          type='search'
          size='large'
          allowClear
          aria-label={t('chooseLanguage')}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder='English, Español, 日本語…'
          prefix={<Search aria-hidden className='size-4 text-mist' />}
          className='mb-4'
        />
        <ul className='grid grid-cols-1 gap-1.5 min-[420px]:grid-cols-2 sm:grid-cols-3'>
          {filtered.map((each) => {
            const active = each === locale
            return (
              <li key={each}>
                <button
                  type='button'
                  lang={each}
                  onClick={() => void choose(each)}
                  aria-current={active ? 'true' : undefined}
                  className={cn(
                    'flex min-h-11 w-full items-center gap-2 rounded-control border px-3 text-start transition-colors',
                    active
                      ? 'border-gold-300/70 bg-gold-400/10 text-gold-200'
                      : 'border-transparent text-ivory hover:border-line-strong hover:bg-white/5'
                  )}
                >
                  <span className='min-w-0 flex-1 font-semibold wrap-anywhere'>{LOCALE_LABELS[each]}</span>
                  {active && <Check aria-hidden className='size-4' />}
                </button>
              </li>
            )
          })}
        </ul>
        {!filtered.length && isLocale(locale) && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />}
      </Dialog>
    </>
  )
}
