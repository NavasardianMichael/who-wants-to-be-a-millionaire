import { type Locale, LOCALE_LABELS, LOCALES } from '@i18n/config'
import { languageName } from '@i18n/languageNames'
import { AppLink } from '@components/ui/bare/AppLink'

/**
 * Every locale's home page, named in the page's language with the endonym beside it — on the
 * English page "Armenian · Հայերեն". The footer lists endonyms only; this is the list a search
 * for "Armenian Who Wants to Be a Millionaire" can match, by its anchor text.
 */
export const LanguageGrid = ({ locale }: { locale: Locale }) => (
  <ul className='grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4'>
    {LOCALES.map((each) => {
      const name = languageName(each, locale)
      return (
        <li key={each}>
          <AppLink
            href='/'
            locale={each}
            hrefLang={each}
            aria-current={each === locale ? 'page' : undefined}
            className='flex h-full flex-col rounded-tag border border-spot-300/10 px-3 py-2 transition-colors hover:border-gold-300/60 aria-[current=page]:border-gold-300/60'
          >
            <span className='text-body-sm font-semibold text-ivory'>{name}</span>
            {LOCALE_LABELS[each] !== name && (
              <span lang={each} className='text-caption text-mist-dim'>
                {LOCALE_LABELS[each]}
              </span>
            )}
          </AppLink>
        </li>
      )
    })}
  </ul>
)
