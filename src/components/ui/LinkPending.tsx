'use client'

import { LoaderCircle } from 'lucide-react'
import { useLinkStatus } from 'next/link'

/**
 * Rendered inside a link: while the page it opens is still loading, it marks the link with
 * `data-link-pending`, which the link's `has-[[data-link-pending]]:` classes style. With
 * `spinner` it also shows a spinner (button links); otherwise the mark is invisible.
 */
export const LinkPending = ({ spinner = false }: { spinner?: boolean }) => {
  const { pending } = useLinkStatus()
  if (!pending) return null
  if (!spinner) return <span hidden data-link-pending />
  return (
    <span data-link-pending aria-hidden className='inline-flex shrink-0 animate-link-pending-in'>
      <LoaderCircle className='size-[1.1em] animate-spin' />
    </span>
  )
}
