import { emblemSvg } from '@helpers/brand'
import { cn } from '@helpers/cn'

/** The emblem inline, so it renders with the HTML and needs no extra request. */
export const Emblem = ({ className, withRays }: { className?: string; withRays?: boolean }) => (
  <span
    aria-hidden
    // A class, not an inline style, so a caller's `hidden` can still win.
    className={cn('inline-block', className)}
    // The markup is our own constant, built from tokens — no user input reaches it.
    dangerouslySetInnerHTML={{ __html: emblemSvg({ withRays }).replace('<svg ', '<svg width="100%" height="100%" ') }}
  />
)
