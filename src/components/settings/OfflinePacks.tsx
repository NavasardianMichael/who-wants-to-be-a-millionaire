'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, Download, RefreshCw, Search, Trash2 } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { usePacksStore } from '@store/offline/packs/store'
import { useSettingsStore } from '@store/settings/store'
import { type Locale, LOCALE_LABELS, LOCALES } from '@i18n/config'
import { cn } from '@helpers/cn'
import { Spinner } from '@components/ui/Spinner'
import { Toggle } from '@components/ui/Toggle'

const formatKb = (bytes: number) => `${Math.max(1, Math.round(bytes / 1024))} KB`

/**
 * Download question packs per language. The current language is pinned first; downloaded
 * packs come next, then everything else — searchable, since 50 rows is a lot to scroll.
 */
export const OfflinePacks = () => {
  const t = useTranslations('Settings')
  const current = useLocale() as Locale
  const packs = usePacksStore.use.packs()
  const downloading = usePacksStore.use.downloading()
  const failed = usePacksStore.use.failed()
  const loadPacks = usePacksStore.use.loadPacks()
  const download = usePacksStore.use.download()
  const remove = usePacksStore.use.remove()
  const autoDownloadPack = useSettingsStore.use.autoDownloadPack()
  const setAutoDownloadPack = useSettingsStore.use.setAutoDownloadPack()
  const [query, setQuery] = useState('')

  useEffect(() => {
    void loadPacks()
  }, [loadPacks])

  const ordered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase()
    return [...LOCALES]
      .filter((locale) => !needle || locale.includes(needle) || LOCALE_LABELS[locale].toLocaleLowerCase().includes(needle))
      .sort((a, b) => {
        const rank = (locale: Locale) => (locale === current ? 0 : packs[locale] ? 1 : 2)
        return rank(a) - rank(b)
      })
  }, [query, packs, current])

  return (
    <div className='flex flex-col gap-4'>
      <Toggle label={t('autoDownload')} checked={autoDownloadPack} onChange={setAutoDownloadPack} />
      <label className='relative block'>
        <span className='sr-only'>{t('packsTitle')}</span>
        <Search aria-hidden className='pointer-events-none absolute inset-s-3 top-1/2 size-4 -translate-y-1/2 text-mist' />
        <input
          type='search'
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder='English, Español, 日本語…'
          className='h-11 w-full rounded-full border border-spot-300/25 bg-studio-950/70 ps-10 pe-4 text-ivory placeholder:text-mist-dim focus:border-gold-300 focus:outline-none'
        />
      </label>
      <ul className='flex max-h-[28rem] flex-col gap-1.5 overflow-y-auto pe-1'>
        {ordered.map((locale) => {
          const pack = packs[locale]
          const busy = downloading.includes(locale)
          return (
            <li
              key={locale}
              className={cn(
                'flex items-center gap-3 rounded-xl border px-3 py-2',
                pack ? 'border-gold-400/30 bg-gold-400/5' : 'border-spot-300/10 bg-studio-950/40'
              )}
            >
              <span className='min-w-0 flex-1'>
                <span lang={locale} className='block truncate font-semibold'>
                  {LOCALE_LABELS[locale]}
                </span>
                <span className='text-caption text-mist'>
                  {pack ? (
                    <>
                      <Check aria-hidden className='me-1 inline size-3.5 text-correct-300' />
                      {t('packDownloaded')} · {t('packCount', { count: pack.count })} · {formatKb(pack.bytes)}
                    </>
                  ) : failed.includes(locale) ? (
                    <span className='text-wrong-300'>{t('packError')}</span>
                  ) : (
                    locale.toUpperCase()
                  )}
                </span>
              </span>
              {busy ? (
                <Spinner size='sm' label={t('packDownloading')} className='text-gold-300' />
              ) : pack ? (
                <span className='flex gap-1'>
                  <button
                    type='button'
                    onClick={() => void download(locale)}
                    aria-label={`${t('packUpdate')} — ${LOCALE_LABELS[locale]}`}
                    className='flex size-10 items-center justify-center rounded-full text-mist hover:bg-white/5 hover:text-ivory'
                  >
                    <RefreshCw aria-hidden className='size-4' />
                  </button>
                  <button
                    type='button'
                    onClick={() => void remove(locale)}
                    aria-label={`${t('packRemove')} — ${LOCALE_LABELS[locale]}`}
                    className='flex size-10 items-center justify-center rounded-full text-mist hover:bg-white/5 hover:text-wrong-300'
                  >
                    <Trash2 aria-hidden className='size-4' />
                  </button>
                </span>
              ) : (
                <button
                  type='button'
                  onClick={() => void download(locale)}
                  className='inline-flex min-h-10 items-center gap-1.5 rounded-full border border-spot-300/30 px-3 text-body-sm font-semibold text-ivory hover:border-gold-300 hover:text-gold-200'
                >
                  <Download aria-hidden className='size-4' />
                  {t('packDownload')}
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
