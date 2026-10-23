import { type ReactNode, Suspense } from 'react'
import { useTranslations } from 'next-intl'
import { AppEffects } from './AppEffects'
import { Footer } from './layout/Footer'
import { Header } from './layout/Header'
import { InstallHint } from './pwa/InstallHint'
import { PageViewTracker } from './pwa/PageViewTracker'
import { ServiceWorkerRegistrar } from './pwa/ServiceWorkerRegistrar'
import { Toaster } from './ui/Toaster'

/**
 * The page shell. A server component: the header and footer — and so every navigation
 * link — are in the server HTML; the client-only parts are small islands.
 *
 * One document-level scroller, so sticky headers, iOS momentum scrolling and scroll
 * restoration all behave.
 */
export const App = ({ children }: { children: ReactNode }) => {
  const t = useTranslations('Common')
  return (
    <>
      <a
        href='#main'
        className='sr-only z-50 rounded-full bg-gold-400 px-4 py-2 font-bold text-studio-950 focus:not-sr-only focus:fixed focus:inset-s-4 focus:top-4'
      >
        {t('skipToContent')}
      </a>
      {/* `useSearchParams` inside: without a boundary every static page would bail out to client rendering. */}
      <Suspense fallback={null}>
        <AppEffects />
      </Suspense>
      <ServiceWorkerRegistrar />
      <PageViewTracker />
      <div className='flex min-h-dvh flex-col'>
        <Header />
        <main id='main' className='flex-1'>
          {children}
        </main>
        <Footer />
      </div>
      <Toaster />
      <InstallHint />
    </>
  )
}
