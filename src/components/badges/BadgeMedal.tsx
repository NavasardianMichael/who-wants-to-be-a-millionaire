import {
  Brain,
  CalendarCheck,
  Crown,
  Earth,
  Flame,
  Footprints,
  Gem,
  HeartHandshake,
  Hourglass,
  Infinity as InfinityIcon,
  Landmark,
  Languages,
  Lock,
  type LucideIcon,
  Mountain,
  Rocket,
  Shield,
  Sparkles,
  Target,
  WifiOff,
  Zap,
} from 'lucide-react'
import type { BadgeId } from '@constants/game'
import { cn } from '@helpers/cn'

export const BADGE_ICONS: Record<BadgeId, LucideIcon> = {
  firstSteps: Footprints,
  safeHaven: Shield,
  halfWay: Mountain,
  millionaire: Crown,
  purist: Gem,
  smartExit: Landmark,
  quickThinker: Zap,
  marathon10: Target,
  marathon25: Flame,
  marathon50: Brain,
  marathon100: InfinityIcon,
  timeAttack15: Hourglass,
  timeAttack30: Rocket,
  polyglot3: Languages,
  polyglot10: Earth,
  streak3: CalendarCheck,
  streak7: Sparkles,
  offlineHero: WifiOff,
  savedByAFriend: HeartHandshake,
  categoryMaster: Crown,
}

export type BadgeMedalProps = {
  badgeId: BadgeId
  earned: boolean
  size?: 'md' | 'lg'
  /** Play the unlock flip (result screen). */
  celebrate?: boolean
  className?: string
}

/** A round medal: gold when earned, a dim padlock when not. Decorative — the name is printed beside it. */
export const BadgeMedal = ({ badgeId, earned, size = 'md', celebrate, className }: BadgeMedalProps) => {
  const Icon = earned ? BADGE_ICONS[badgeId] : Lock
  return (
    <span
      aria-hidden
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2',
        size === 'md' ? 'size-14' : 'size-20',
        earned
          ? 'border-gold-200 bg-[radial-gradient(circle_at_35%_30%,var(--color-gold-200),var(--color-gold-500)_60%,var(--color-gold-700))] text-studio-950 shadow-glow-gold'
          : 'border-studio-600 bg-studio-900 text-mist-dim',
        celebrate && 'animate-pop',
        className
      )}
    >
      <Icon className={size === 'md' ? 'size-6' : 'size-9'} strokeWidth={2.2} />
      {earned && <span className='absolute inset-0 sweep-gold' />}
    </span>
  )
}
