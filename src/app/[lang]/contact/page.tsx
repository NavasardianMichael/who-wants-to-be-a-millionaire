import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { currentLocale, pageMetadata } from '@i18n/metadata'
import { ROUTES } from '@constants/routes'
import { contactPageSchema } from '@linkedDataSchema/index'
import { ContactForm } from '@components/contact/ContactForm'
import { JsonLd } from '@components/seo/JsonLd'
import { Card } from '@components/ui/layout/Card'
import { PageHeader } from '@components/ui/layout/PageHeader'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Seo')
  return pageMetadata({ path: ROUTES.contact, title: t('contactTitle'), description: t('contactDescription') })
}

/** Static per locale; the form is the only client island. Messages go to the inbox, never the database. */
export default async function ContactPage() {
  const [t, locale] = await Promise.all([getTranslations(), currentLocale()])
  return (
    <>
      <JsonLd data={contactPageSchema(locale, t('Seo.contactTitle'), t('Seo.contactDescription'))} />
      <PageHeader title={t('Contact.title')} subtitle={t('Contact.subtitle')} className='items-center text-center' />
      <div className='container-page flex justify-center pb-16'>
        <Card className='panel-chrome w-full max-w-2xl'>
          <ContactForm />
        </Card>
      </div>
    </>
  )
}
