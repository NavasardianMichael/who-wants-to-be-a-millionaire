import { cn } from '@helpers/cn'
import { resolveAvatarUrl } from '@helpers/url'

export type AvatarProps = {
  name: string
  url: string | null | undefined
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const initials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toLocaleUpperCase())
    .join('') || '?'

/** A plain `<img>`: avatars come from Google or the API, and `referrerPolicy` keeps Google's CDN from 403-ing. */
export const Avatar = ({ name, url, size = 'md', className }: AvatarProps) => {
  const src = resolveAvatarUrl(url)
  const sizeClass = { sm: 'size-8 text-caption', md: 'size-10 text-body-sm', lg: 'size-16 text-h3', xl: 'size-28 text-h2' }[size]

  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-gold-400/50 bg-studio-700 font-display font-bold text-gold-200',
        sizeClass,
        className
      )}
    >
      {src ? (
        <img src={src} alt='' referrerPolicy='no-referrer' loading='lazy' className='size-full object-cover' />
      ) : (
        <span aria-hidden>{initials(name)}</span>
      )}
    </span>
  )
}
