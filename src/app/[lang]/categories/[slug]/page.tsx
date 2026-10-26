import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { currentLocale, pageMetadata } from '@i18n/metadata'
import { CATEGORIES } from '@constants/game'
import { CATEGORY_SLUGS, categoryFromSlug, categoryPath, ROUTES } from '@constants/routes'
import { fetchCategorySamples } from '@helpers/serverData'
import { breadcrumbSchema } from '@linkedDataSchema/index'
import { SampleQuestionCard } from '@components/categories/SampleQuestionCard'
import { CATEGORY_ICONS, CategoryGrid } from '@components/marketing/CategoryGrid'
import { JsonLd } from '@components/seo/JsonLd'
import { ButtonLink } from '@components/ui/bare/AppLink'
import { PageHeader } from '@components/ui/layout/PageHeader'
import { Section } from '@components/ui/layout/Section'

/** 16 landing pages per locale, built ahead and refreshed hourly as the pool grows (a build without the API starts them empty). */
export const revalidate = 3600
export const dynamicParams = false

export function generateStaticParams() {
  return CATEGORIES.map((category) => ({ slug: CATEGORY_SLUGS[category] }))
}

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = categoryFromSlug((await params).slug)
  if (!category) return {}
  const t = await getTranslations()
  const name = t(`Categories.names.${category}`)
  return pageMetadata({
    path: categoryPath(category),
    title: t('Seo.categoryTitle', { category: name }),
    description: t('Seo.categoryDescription', { category: name, description: t(`Categories.descriptions.${category}`) }),
  })
}

export default async function CategoryPage({ params }: Props) {
  const category = categoryFromSlug((await params).slug)
  if (!category) notFound()

  const [t, locale] = await Promise.all([getTranslations(), currentLocale()])
  const samples = await fetchCategorySamples(locale, category)
  const name = t(`Categories.names.${category}`)
  const Icon = CATEGORY_ICONS[category]

  return (
    <>
      <JsonLd
        data={breadcrumbSchema(locale, [
          { name: t('Nav.home'), path: ROUTES.home },
          { name: t('Categories.title'), path: ROUTES.categories },
          { name, path: categoryPath(category) },
        ])}
      />
      <PageHeader
        eyebrow={
          <span className='inline-flex items-center gap-2'>
            <Icon aria-hidden className='size-4' /> {t('Categories.title')}
          </span>
        }
        title={t('Seo.categoryTitle', { category: name })}
        subtitle={t(`Categories.descriptions.${category}`)}
        actions={
          <ButtonLink href={{ pathname: ROUTES.play, query: { category } }}>{t('Categories.playCategory', { category: name })}</ButtonLink>
        }
      />

      <Section id='samples' title={t('Categories.sampleTitle')} subtitle={t('Categories.sampleSubtitle', { category: name })}>
        {samples.length ? (
          <ol className='grid gap-4 md:grid-cols-2'>
            {samples.map((sample, index) => (
              <SampleQuestionCard key={sample.id} number={index + 1} question={sample} />
            ))}
          </ol>
        ) : (
          <p className='panel p-6 text-mist'>{t('Categories.noSamples')}</p>
        )}
      </Section>

      <Section id='more' title={t('Categories.otherCategories')}>
        <CategoryGrid exclude={category} />
      </Section>
    </>
  )
}
