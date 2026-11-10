import { type Locale, LOCALE_LABELS, LOCALES } from '@i18n/config'
import { AppLink } from '@components/ui/bare/AppLink'

/**
 * Every locale's home page, named only by its endonym (`LOCALE_LABELS`). A language is never
 * renamed into the page's language — "Português (Brasil)" stays that on an Armenian page.
 */
export const LanguageGrid = ({ locale }: { locale: Locale }) => (
  <ul className='grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4'>
    {LOCALES.map((each) => (
      <li key={each}>
        <AppLink
          href='/'
          locale={each}
          hrefLang={each}
          aria-current={each === locale ? 'page' : undefined}
          className='flex h-full flex-col rounded-tag border border-spot-300/10 px-3 py-2 transition-colors hover:border-gold-300/60 aria-[current=page]:border-gold-300/60'
        >
          <span lang={each} className='text-body-sm font-semibold text-ivory'>
            {LOCALE_LABELS[each]}
          </span>
        </AppLink>
      </li>
    ))}
  </ul>
)
