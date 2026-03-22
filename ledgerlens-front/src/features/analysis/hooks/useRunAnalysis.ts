import { useChainId, useConnection, useSwitchChain, useWalletClient } from "wagmi"
import { chainIdForX402Payment } from "@/wagmi"
import { useAnalysisStore } from "@/features/analysis/store/useAnalysisStore"

function x402PaymentChainId(): number {
  const net = String(import.meta.env.VITE_X402_NETWORK ?? "fuji").toLowerCase()
  return net === "mainnet" || net === "c-chain"
    ? chainIdForX402Payment.mainnet
    : chainIdForX402Payment.fuji
}

/**
 * Ejecuta el análisis: si hay wallet conectada, cambia a la red de cobro x402 (Fuji / C-Chain)
 * y pasa el walletClient para firmar EIP-3009 vía @x402/fetch.
 */
export function useRunAnalysis() {
  const { fetchAnalysis } = useAnalysisStore()
  const { data: walletClient } = useWalletClient()
  const { switchChainAsync } = useSwitchChain()
  const chainId = useChainId()
  const { address, status } = useConnection()
  const connected = status === "connected" && !!address

  return async (addr: string) => {
    const trimmed = addr.trim()
    if (!trimmed) return
    if (connected && walletClient) {
      const payChain = x402PaymentChainId()
      if (chainId !== payChain) {
        try {
          await switchChainAsync({ chainId: payChain })
        } catch {
          /* usuario rechazó */
        }
      }
      await fetchAnalysis(trimmed, walletClient)
      return
    }
    await fetchAnalysis(trimmed)
  }
}
