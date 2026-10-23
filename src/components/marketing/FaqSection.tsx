import { ChevronDown } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { LADDER } from '@constants/game'
import { formatMoney } from '@helpers/money'
import { faqSchema } from '@linkedDataSchema/index'
import { JsonLd } from '@components/seo/JsonLd'

const FAQ_COUNT = 6

/** Native `<details>`: works without JavaScript, and every answer is in the HTML for crawlers. */
export const FaqSection = async ({ locale }: { locale: string }) => {
  const t = await getTranslations('Home')
  const values = { havenOne: formatMoney(LADDER[4], locale), havenTwo: formatMoney(LADDER[9], locale) }
  const items = Array.from({ length: FAQ_COUNT }, (_, index) => ({
    question: t(`faq${index + 1}Question`),
    answer: t(`faq${index + 1}Answer`, values),
  }))

  return (
    <>
      <JsonLd data={faqSchema(items)} />
      <div className='mx-auto flex max-w-3xl flex-col gap-3'>
        {items.map(({ question, answer }) => (
          <details key={question} className='group panel overflow-hidden'>
            <summary className='flex min-h-14 cursor-pointer list-none items-center gap-3 px-5 py-3 font-semibold text-ivory [&::-webkit-details-marker]:hidden'>
              <span className='flex-1'>{question}</span>
              <ChevronDown aria-hidden className='size-5 shrink-0 text-gold-300 transition-transform group-open:rotate-180' />
            </summary>
            <p className='border-t border-spot-300/10 px-5 py-4 text-mist'>{answer}</p>
          </details>
        ))}
      </div>
    </>
  )
}
