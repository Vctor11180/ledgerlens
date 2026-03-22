import type { WalletClient } from "viem"
import { create } from "zustand"
import {
  fetchAnalysis as fetchAnalysisApi,
  type SupportedChain,
} from "@/lib/api"
import type { AnalysisResult } from "@/lib/analysis.types"

interface AnalysisState {
  walletAddress: string
  chain: SupportedChain
  isLoading: boolean
  analysisResult: AnalysisResult | null
  error: string | null
  setWalletAddress: (address: string) => void
  setChain: (chain: SupportedChain) => void
  fetchAnalysis: (address: string, walletClient?: WalletClient | null) => void
  reset: () => void
}

export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  walletAddress: "",
  chain: "avalanche",
  isLoading: false,
  analysisResult: null,
  error: null,

  setWalletAddress: (address) => set({ walletAddress: address }),
  setChain: (chain) => set({ chain }),

  fetchAnalysis: async (address, walletClient) => {
    const trimmed = address.trim()
    if (!trimmed) return

    set({ isLoading: true, walletAddress: trimmed, analysisResult: null, error: null })

    try {
      const result = await fetchAnalysisApi(trimmed, get().chain, walletClient)
      set({ isLoading: false, analysisResult: result })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : "Error desconocido",
      })
    }
  },

  reset: () =>
    set({
      walletAddress: "",
      chain: "avalanche",
      isLoading: false,
      analysisResult: null,
      error: null,
    }),
}))
