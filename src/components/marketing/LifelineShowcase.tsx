import { Phone, Repeat, Users } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { type Lifeline, LIFELINES } from '@constants/game'

const ICON: Record<Lifeline, React.ReactNode> = {
  fiftyFifty: <span className='font-display text-body font-black'>50:50</span>,
  askAudience: <Users aria-hidden className='size-6' />,
  phoneAFriend: <Phone aria-hidden className='size-6' />,
  switchQuestion: <Repeat aria-hidden className='size-6' />,
}

export const LifelineShowcase = async () => {
  const t = await getTranslations('Lifelines')
  return (
    <ul className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
      {LIFELINES.map((lifeline) => (
        <li key={lifeline} className='panel flex flex-col items-center gap-3 p-6 text-center'>
          <span className='flex size-20 items-center justify-center rounded-full border-2 border-spot-300/70 bg-[radial-gradient(ellipse_at_50%_30%,var(--color-studio-600),var(--color-studio-900))] text-ivory shadow-glow-spot'>
            {ICON[lifeline]}
          </span>
          <h3 className='font-display text-h3 font-bold text-ivory'>{t(lifeline)}</h3>
          <p className='text-body-sm text-mist'>{t(`${lifeline}Description`)}</p>
        </li>
      ))}
    </ul>
  )
}
