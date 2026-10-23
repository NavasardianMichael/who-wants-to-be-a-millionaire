import { getTranslations } from 'next-intl/server'

export const HowToPlay = async () => {
  const t = await getTranslations('Home')
  const steps = [1, 2, 3, 4].map((step) => ({ title: t(`howStep${step}Title`), body: t(`howStep${step}Body`) }))

  return (
    <ol className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
      {steps.map(({ title, body }, index) => (
        <li key={title} className='panel relative flex flex-col gap-2 p-5 pt-8'>
          <span
            aria-hidden
            className='absolute -top-4 inset-s-5 flex size-9 items-center justify-center rounded-full bg-gold-400 font-display font-black text-studio-950 shadow-glow-gold'
          >
            {index + 1}
          </span>
          <h3 className='font-display text-h3 font-bold text-ivory'>{title}</h3>
          <p className='text-body-sm text-mist'>{body}</p>
        </li>
      ))}
    </ol>
  )
}
