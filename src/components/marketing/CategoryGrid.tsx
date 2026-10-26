import {
  Atom,
  BookOpen,
  Clapperboard,
  Cpu,
  Globe2,
  Landmark,
  Languages,
  Leaf,
  type LucideIcon,
  Music,
  Palette,
  Sparkles,
  Star,
  Trophy,
  UtensilsCrossed,
  Wand2,
} from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { CATEGORIES, type Category } from '@constants/game'
import { categoryPath } from '@constants/routes'
import { AppLink } from '@components/ui/bare/AppLink'

export const CATEGORY_ICONS: Record<Category, LucideIcon> = {
  general: Sparkles,
  history: Landmark,
  geography: Globe2,
  science: Atom,
  nature: Leaf,
  literature: BookOpen,
  art: Palette,
  music: Music,
  filmTv: Clapperboard,
  sports: Trophy,
  technology: Cpu,
  food: UtensilsCrossed,
  mythology: Wand2,
  language: Languages,
  popCulture: Star,
  localCulture: Landmark,
}

export const CategoryGrid = async ({ exclude, withDescriptions }: { exclude?: Category; withDescriptions?: boolean }) => {
  const t = await getTranslations('Categories')
  return (
    <ul className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4'>
      {CATEGORIES.filter((category) => category !== exclude).map((category) => {
        const Icon = CATEGORY_ICONS[category]
        return (
          <li key={category}>
            <AppLink
              href={categoryPath(category)}
              className='panel flex h-full flex-col gap-2 p-4 transition-[transform,border-color] duration-300 hover:-translate-y-0.5 hover:border-gold-300/60'
            >
              <Icon aria-hidden className='size-6 text-gold-300' />
              <span className='font-display font-bold text-ivory'>{t(`names.${category}`)}</span>
              {withDescriptions && <span className='text-caption text-mist'>{t(`descriptions.${category}`)}</span>}
            </AppLink>
          </li>
        )
      })}
    </ul>
  )
}
