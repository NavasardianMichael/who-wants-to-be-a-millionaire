import { cn } from '@helpers/cn'

export const Skeleton = ({ className }: { className?: string }) => (
  <div aria-hidden className={cn('animate-pulse rounded-lg bg-studio-700/50', className)} />
)
