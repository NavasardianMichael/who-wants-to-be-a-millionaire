import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { pageMetadata } from '@i18n/metadata'
import { ROUTES } from '@constants/routes'
import { LanguageSwitcher } from '@components/layout/LanguageSwitcher'
import { InstallButton } from '@components/pwa/InstallButton'
import { OfflinePacks } from '@components/settings/OfflinePacks'
import { SoundSettings } from '@components/settings/SoundSettings'
import { Card } from '@components/ui/layout/Card'
import { PageHeader } from '@components/ui/layout/PageHeader'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Seo')
  return pageMetadata({ path: ROUTES.settings, title: t('settingsTitle'), description: t('settingsDescription'), noIndex: true })
}

export default async function SettingsPage() {
  const t = await getTranslations()
  return (
    <>
      <PageHeader title={t('Settings.title')} subtitle={t('Settings.subtitle')} />
      <div className='container-page grid items-start gap-6 pb-16 lg:grid-cols-[1fr_1.2fr]'>
        <div className='flex flex-col gap-6'>
          <Card className='flex flex-col gap-4'>
            <h2 className='text-h3 font-bold text-gold-200'>{t('Settings.soundTitle')}</h2>
            <SoundSettings />
          </Card>
          <Card className='flex flex-col gap-4'>
            <h2 className='text-h3 font-bold text-gold-200'>{t('Common.language')}</h2>
            <LanguageSwitcher className='self-start' />
          </Card>
          <Card tone='gold' className='flex flex-col gap-3'>
            <h2 className='text-h3 font-bold text-gold-200'>{t('Settings.installTitle')}</h2>
            <p className='text-body-sm text-mist'>{t('Settings.installBody')}</p>
            <InstallButton withLabel />
          </Card>
        </div>
        <Card className='flex flex-col gap-4'>
          <h2 className='text-h3 font-bold text-gold-200'>{t('Settings.packsTitle')}</h2>
          <p className='text-body-sm text-mist'>{t('Settings.packsSubtitle')}</p>
          <OfflinePacks />
        </Card>
      </div>
    </>
  )
}
