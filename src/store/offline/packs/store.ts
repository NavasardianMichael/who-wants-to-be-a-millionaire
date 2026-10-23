import { create } from 'zustand'
import { combine } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { appendSelectors } from '@store/appendSelectors'
import { isLocale } from '@i18n/config'
import { trackEvent } from '@helpers/analytics'
import { downloadPack, listPacks, removePack } from '@helpers/offline/packs'
import { reportError } from '@helpers/reportError'
import { PacksActions, PacksState } from './types'

const initialState: PacksState = {
  packs: {},
  downloading: [],
  failed: [],
  isLoaded: false,
  isPending: false,
  error: null,
}

export const usePacksStoreBase = create<PacksState & PacksActions>()(
  immer(
    combine(
      initialState,
      (set): PacksActions => ({
        loadPacks: async () => {
          const packs = await listPacks()
          set((state) => {
            state.packs = Object.fromEntries(packs.map((pack) => [pack.locale, pack]))
            state.isLoaded = true
          })
        },
        download: async (locale) => {
          if (!isLocale(locale)) return false
          set((state) => {
            state.downloading.push(locale)
            state.failed = state.failed.filter((each) => each !== locale)
          })
          try {
            const pack = await downloadPack(locale)
            set((state) => {
              state.packs[locale] = pack
            })
            trackEvent('pack_downloaded', { locale })
            return true
          } catch (error) {
            reportError(error, 'packs:download', { silent: true })
            set((state) => {
              state.failed.push(locale)
            })
            return false
          } finally {
            set((state) => {
              state.downloading = state.downloading.filter((each) => each !== locale)
            })
          }
        },
        remove: async (locale) => {
          await removePack(locale)
          set((state) => {
            delete state.packs[locale]
          })
        },
      })
    )
  )
)

export const usePacksStore = appendSelectors(usePacksStoreBase)
