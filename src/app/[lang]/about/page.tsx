import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { pageMetadata } from '@i18n/metadata'
import { AUTHOR } from '@constants/app'
import { ROUTES } from '@constants/routes'
import { PageHeader } from '@components/ui/layout/PageHeader'
import { Prose } from '@components/ui/layout/Prose'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Seo')
  return pageMetadata({ path: ROUTES.about, title: t('aboutTitle'), description: t('aboutDescription') })
}

export default async function AboutPage() {
  const t = await getTranslations('About')
  return (
    <>
      <PageHeader title={t('title')} subtitle={t('intro')} />
      <Prose>
        <h2>{t('missionTitle')}</h2>
        <p>{t('missionBody')}</p>
        <h2>{t('howTitle')}</h2>
        <p>{t('howBody')}</p>
        <h2>{t('techTitle')}</h2>
        <p>{t('techBody')}</p>
        <h2>{t('creditTitle')}</h2>
        <p>
          {t('creditBody', { author: AUTHOR.name })}{' '}
          <a href={AUTHOR.url} rel='author noopener' target='_blank' className='text-spot-300 underline-offset-4 hover:underline'>
            LinkedIn
          </a>
        </p>
        <p className='mt-6 text-caption text-mist-dim'>{t('disclaimer')}</p>
      </Prose>
    </>
  )
}
