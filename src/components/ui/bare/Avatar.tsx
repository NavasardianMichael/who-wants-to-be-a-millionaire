import { Avatar as AntAvatar } from 'antd'
import { cn } from '@helpers/cn'
import { resolveAvatarUrl } from '@helpers/url'

export type AvatarProps = {
  name: string
  url: string | null | undefined
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const SIZES = { sm: 32, md: 40, lg: 64, xl: 112 } as const
const TEXT = { sm: 'text-caption', md: 'text-body-sm', lg: 'text-h3', xl: 'text-h2' } as const

const initials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toLocaleUpperCase())
    .join('') || '?'

/**
 * antd's `Avatar` with initials as the fallback. The image is our own `<img>` so it can
 * carry `referrerPolicy` — without it Google's avatar CDN answers 403.
 */
export const Avatar = ({ name, url, size = 'md', className }: AvatarProps) => {
  const src = resolveAvatarUrl(url)
  return (
    <AntAvatar
      size={SIZES[size]}
      src={src ? <img src={src} alt='' referrerPolicy='no-referrer' loading='lazy' /> : undefined}
      className={cn(
        'shrink-0 border border-gold-400/50 bg-[linear-gradient(160deg,var(--color-studio-500),var(--color-studio-800))] font-display font-bold text-gold-200',
        TEXT[size],
        className
      )}
    >
      <span aria-hidden>{initials(name)}</span>
    </AntAvatar>
  )
}
