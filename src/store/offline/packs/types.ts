import { StateCommonProps } from '@interfaces/store'
import type { PackSummary } from '@helpers/offline/packs'

export type PacksState = StateCommonProps & {
  packs: Record<string, PackSummary>
  /** Locales downloading right now. */
  downloading: string[]
  failed: string[]
  isLoaded: boolean
}

export type PacksActions = {
  loadPacks: () => Promise<void>
  download: (locale: string) => Promise<boolean>
  remove: (locale: string) => Promise<void>
}
