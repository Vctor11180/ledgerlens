import { createConfig, http } from "wagmi"
import { avalanche, avalancheFuji, mainnet } from "wagmi/chains"
import { injected, metaMask } from "wagmi/connectors"

/**
 * Avalanche C-Chain + Fuji (testnet, x402 USDC) + Ethereum mainnet.
 */
export const config = createConfig({
  chains: [avalanche, avalancheFuji, mainnet],
  transports: {
    [avalanche.id]: http(),
    [avalancheFuji.id]: http(),
    [mainnet.id]: http(),
  },
  connectors: [
    metaMask(),
    injected({ shimDisconnect: true }),
  ],
})

export const chainIdForApp = {
  avalanche: avalanche.id,
  fuji: avalancheFuji.id,
  ethereum: mainnet.id,
} as const

/** Red usada para cobrar con x402 (según VITE_X402_NETWORK en el cliente). */
export const chainIdForX402Payment = {
  fuji: avalancheFuji.id,
  mainnet: avalanche.id,
} as const
