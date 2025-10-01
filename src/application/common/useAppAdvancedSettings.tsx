import { MAINNET_PROGRAM_ID, RAYDIUM_MAINNET } from '@raydium-io/raydium-sdk'
import { create } from 'zustand'
import { ApiConfig } from './apiUrl.config'
import { getLocalItem } from '@/functions/dom/jStorage'

export const DEFAULT_URL_ENDPOINT = 'https://mainnet.helius-rpc.com/?api-key=f56338c9-8b99-4251-b4ee-bcd2fe5a6241'
// export const DEFAULT_URL_ENDPOINT = 'https://mainnet.helius-rpc.com/?api-key=31390b16-66b7-4242-b31b-7cb514dca1d6'
// export const DEFAULT_URL_ENDPOINT = 'https://mainnet.helius-rpc.com/?api-key=1ae02af9-8095-49d4-a455-1a2e73b2ca1c'
export type AppAdvancedSettingsStore = {
  mode: 'mainnet' | 'devnet'
  programIds: typeof MAINNET_PROGRAM_ID
  readonly apiUrls: {
    [K in keyof ApiConfig]: `https://uapi.raydium.io/${K}`
  }
  apiUrlOrigin: string
  apiUrlPathnames: typeof RAYDIUM_MAINNET
}

export const useAppAdvancedSettings = create<AppAdvancedSettingsStore>((set, get) => ({
  mode: getLocalItem('ADVANCED_SETTINGS_TAB') ?? 'mainnet',
  programIds: MAINNET_PROGRAM_ID,
  get apiUrls() {
    return new Proxy({} as any, {
      get(target, p, receiver) {
        return `${get().apiUrlOrigin}${get().apiUrlPathnames[p]}`
      }
    })
  },
  apiUrlOrigin: getLocalItem('ADVANCED_SETTINGS_ENDPOINT') ?? DEFAULT_URL_ENDPOINT,
  apiUrlPathnames: RAYDIUM_MAINNET
}))

export default useAppAdvancedSettings
