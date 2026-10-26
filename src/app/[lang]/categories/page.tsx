import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { currentLocale, pageMetadata } from '@i18n/metadata'
import { ROUTES } from '@constants/routes'
import { breadcrumbSchema } from '@linkedDataSchema/index'
import { CategoryGrid } from '@components/marketing/CategoryGrid'
import { JsonLd } from '@components/seo/JsonLd'
import { PageHeader } from '@components/ui/layout/PageHeader'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Seo')
  return pageMetadata({ path: ROUTES.categories, title: t('categoriesTitle'), description: t('categoriesDescription') })
}

export default async function CategoriesPage() {
  const [t, locale] = await Promise.all([getTranslations(), currentLocale()])
  return (
    <>
      <JsonLd
        data={breadcrumbSchema(locale, [
          { name: t('Nav.home'), path: ROUTES.home },
          { name: t('Categories.title'), path: ROUTES.categories },
        ])}
      />
      <PageHeader title={t('Categories.title')} subtitle={t('Categories.subtitle')} />
      <div className='container-page pb-16'>
        <CategoryGrid withDescriptions />
      </div>
    </>
  )
}
