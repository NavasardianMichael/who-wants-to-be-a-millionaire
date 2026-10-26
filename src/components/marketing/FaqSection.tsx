import { getTranslations } from 'next-intl/server'
import { LADDER } from '@constants/game'
import { formatMoney } from '@helpers/money'
import { faqSchema } from '@linkedDataSchema/index'
import { JsonLd } from '@components/seo/JsonLd'
import { FaqAccordion } from './FaqAccordion'

const FAQ_COUNT = 6

/** Copy and JSON-LD resolved on the server; the accordion is a small client island. */
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
      <FaqAccordion items={items} />
    </>
  )
}
