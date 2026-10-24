import { ArrowRight, Clock, Infinity as InfinityIcon, type LucideIcon, Trophy } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { type GameMode, LADDER, MARATHON_RULES, TIME_ATTACK_RULES } from '@constants/game'
import { ROUTES } from '@constants/routes'
import { cn } from '@helpers/cn'
import { formatMoney } from '@helpers/money'
import { AppLink } from '@components/ui/bare/AppLink'

const MODES: { mode: GameMode; href: string; icon: LucideIcon; accent: string }[] = [
  // Literal class names: Tailwind only generates what it can find in the source text.
  { mode: 'classic', href: ROUTES.play, icon: Trophy, accent: 'before:from-gold-400/25' },
  { mode: 'marathon', href: ROUTES.marathon, icon: InfinityIcon, accent: 'before:from-spot-500/25' },
  { mode: 'timeAttack', href: ROUTES.timeAttack, icon: Clock, accent: 'before:from-lock-500/25' },
]

/**
 * The three modes as large tappable cards. `exclude` drops the mode of the page they appear
 * on; `compact` stacks them as rows (icon, name, tagline) for the home page's hero.
 */
export const ModeCards = async ({ locale, exclude, compact }: { locale: string; exclude?: GameMode; compact?: boolean }) => {
  const t = await getTranslations()
  const values = {
    top: formatMoney(LADDER[LADDER.length - 1], locale),
    seconds: TIME_ATTACK_RULES.durationSeconds,
    penalty: TIME_ATTACK_RULES.wrongPenaltySeconds,
  }

  if (compact) {
    return (
      <ul className='flex w-full flex-col gap-3'>
        {MODES.filter(({ mode }) => mode !== exclude).map(({ mode, href, icon: Icon, accent }) => (
          <li key={mode}>
            <AppLink
              href={href}
              className={cn(
                'group panel-chrome relative flex items-center gap-4 overflow-hidden p-4 text-start transition-[transform,filter] duration-300 hover:-translate-y-0.5 hover:brightness-110',
                'before:absolute before:inset-0 before:-z-10 before:bg-linear-to-r before:to-transparent',
                accent
              )}
            >
              <span className='flex size-12 shrink-0 items-center justify-center rounded-control border border-gold-400/40 bg-studio-950/60 text-gold-300 shadow-glow-gold'>
                <Icon aria-hidden className='size-6' />
              </span>
              <span className='flex min-w-0 flex-1 flex-col'>
                <span className='font-display text-h3 font-extrabold text-ivory'>{t(`Modes.${mode}.name`)}</span>
                <span className='text-body-sm font-semibold text-gold-300'>{t(`Modes.${mode}.tagline`, values)}</span>
              </span>
              <ArrowRight
                aria-hidden
                className='size-5 shrink-0 text-gold-200 transition-transform group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1'
              />
            </AppLink>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <ul className='grid gap-4 md:grid-cols-3'>
      {MODES.filter(({ mode }) => mode !== exclude).map(({ mode, href, icon: Icon, accent }) => (
        <li key={mode}>
          <AppLink
            href={href}
            className={cn(
              'group panel relative flex h-full flex-col gap-4 overflow-hidden p-6 transition-[transform,border-color] duration-300 hover:-translate-y-1 hover:border-gold-300/60',
              'before:absolute before:inset-0 before:-z-10 before:bg-linear-to-br before:to-transparent',
              accent
            )}
          >
            <span className='flex size-14 items-center justify-center rounded-control border border-gold-400/40 bg-studio-950/60 text-gold-300 shadow-glow-gold'>
              <Icon aria-hidden className='size-7' />
            </span>
            <span className='flex flex-col gap-1'>
              <span className='font-display text-h3 font-extrabold text-ivory'>{t(`Modes.${mode}.name`)}</span>
              <span className='text-body-sm font-semibold text-gold-300'>{t(`Modes.${mode}.tagline`, values)}</span>
            </span>
            <span className='flex-1 text-body-sm text-mist'>
              {t(`Modes.${mode}.description`, { ...values, seconds: mode === 'marathon' ? MARATHON_RULES.questionSeconds : values.seconds })}
            </span>
            <span className='inline-flex items-center gap-1.5 font-display font-bold text-gold-200'>
              {t('Common.playNow')}
              <ArrowRight aria-hidden className='size-4 transition-transform group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1' />
            </span>
          </AppLink>
        </li>
      ))}
    </ul>
  )
}
