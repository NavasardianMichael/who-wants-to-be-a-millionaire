import type { CSSProperties, ReactNode } from 'react'
import type { Metadata, Viewport } from 'next'
import { notFound } from 'next/navigation'
import Script from 'next/script'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { getDirection, LOCALES } from '@i18n/config'
import { routing } from '@i18n/routing'
import { GA_ENABLED, GA_INIT_SCRIPT, GA_SCRIPT_SRC } from '@constants/analytics'
import { APP_NAME, AUTHOR } from '@constants/app'
import { cn } from '@helpers/cn'
import { getSiteUrl } from '@helpers/url'
import { App } from '@components/App'
import { StudioBackdrop } from '@components/layout/StudioBackdrop'
import '@styles/globals.css'
import { fontBody, fontHeading, getScriptFont } from '@styles/fonts'
import { STUDIO } from '@styles/tokens'

/**
 * No `maximumScale`/`userScalable`: pinch-zoom must stay available. `viewportFit: 'cover'`
 * makes `env(safe-area-inset-*)` non-zero on notched phones.
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
  themeColor: STUDIO[950],
  colorScheme: 'dark',
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Seo')
  return {
    metadataBase: new URL(getSiteUrl()),
    title: { default: t('homeTitle'), template: `%s | ${APP_NAME}` },
    description: t('homeDescription'),
    keywords: t('keywords'),
    applicationName: APP_NAME,
    manifest: '/manifest.webmanifest',
    appleWebApp: { capable: true, title: APP_NAME, statusBarStyle: 'black-translucent' },
    other: { 'apple-mobile-web-app-capable': 'yes' },
    openGraph: { type: 'website', siteName: APP_NAME },
    creator: AUTHOR.name,
    authors: [{ name: AUTHOR.name, url: AUTHOR.url }],
    category: 'game',
    robots: { index: true, follow: true },
    ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
      ? { verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } }
      : {}),
  }
}

/** Prerenders the shell for all 50 locales; otherwise every route would be dynamic. */
export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }))
}

type Props = {
  children: ReactNode
  params: Promise<{ lang: string }>
}

export default async function RootLayout({ children, params }: Props) {
  const { lang } = await params
  // A path segment is user input until proven otherwise; an unknown one must 404.
  if (!hasLocale(routing.locales, lang)) notFound()

  const scriptFont = getScriptFont(lang)
  const style = scriptFont ? ({ '--font-script': `'${scriptFont.family}'` } as CSSProperties) : undefined

  return (
    <html lang={lang} dir={getDirection(lang)} className={cn(fontHeading.variable, fontBody.variable)} style={style}>
      <head>
        {scriptFont && (
          <>
            <link rel='preconnect' href='https://fonts.googleapis.com' />
            <link rel='preconnect' href='https://fonts.gstatic.com' crossOrigin='anonymous' />
            <link rel='stylesheet' href={scriptFont.href} />
          </>
        )}
      </head>
      <body>
        <StudioBackdrop />
        <NextIntlClientProvider>
          <App>{children}</App>
        </NextIntlClientProvider>
        {GA_ENABLED && (
          <>
            <Script src={GA_SCRIPT_SRC} strategy='afterInteractive' />
            <Script id='ga-init' strategy='afterInteractive'>
              {GA_INIT_SCRIPT}
            </Script>
          </>
        )}
      </body>
    </html>
  )
}
