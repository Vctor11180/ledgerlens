import type { WalletClient } from "viem"
import { wrapFetchWithPayment } from "@x402/fetch"
import { x402Client, x402HTTPClient } from "@x402/core/client"
import { ExactEvmScheme } from "@x402/evm/exact/client"
import { decodePaymentResponseHeader } from "@x402/core/http"
import type { AnalysisResult } from "./analysis.types"

const API_BASE =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.DEV ? "http://localhost:3001" : "")

export type SupportedChain = "avalanche" | "fuji" | "ethereum"

export class PaymentRequiredError extends Error {
  paymentRequired?: unknown

  constructor(message: string, paymentRequired?: unknown) {
    super(message)
    this.name = "PaymentRequiredError"
    this.paymentRequired = paymentRequired
  }
}

function extractPaymentTx(res: Response): string | undefined {
  const raw =
    res.headers.get("PAYMENT-RESPONSE") ??
    res.headers.get("payment-response") ??
    res.headers.get("X-PAYMENT-RESPONSE") ??
    res.headers.get("x-payment-response")
  if (!raw) return undefined
  try {
    const decoded = decodePaymentResponseHeader(raw) as {
      transaction?: string
      txHash?: string
    }
    return decoded.transaction ?? decoded.txHash
  } catch {
    return undefined
  }
}

async function throwPaymentRequiredIf402(res: Response): Promise<void> {
  if (res.status !== 402) return
  const text = await res.text()
  let body: unknown
  try {
    body = text ? JSON.parse(text) : undefined
  } catch {
    body = undefined
  }
  const http = new x402HTTPClient(new x402Client())
  try {
    const getHeader = (name: string) => {
      const direct = res.headers.get(name)
      if (direct) return direct
      const lower = name.toLowerCase()
      for (const [k, v] of res.headers.entries()) {
        if (k.toLowerCase() === lower) return v
      }
      return null
    }
    const pr = http.getPaymentRequiredResponse(
      getHeader,
      body as object | undefined
    )
    throw new PaymentRequiredError(
      "Se requiere pago USDC (x402). Conecta tu wallet en la red configurada y vuelve a analizar.",
      pr
    )
  } catch (e) {
    if (e instanceof PaymentRequiredError) throw e
    throw new PaymentRequiredError(
      "Se requiere pago USDC (x402). Conecta tu wallet y vuelve a intentar."
    )
  }
}

export async function fetchAnalysis(
  address: string,
  chain: SupportedChain,
  walletClient?: WalletClient | null
): Promise<AnalysisResult> {
  const query = new URLSearchParams({ chain })
  const url = `${API_BASE}/api/analyze/${encodeURIComponent(address)}?${query.toString()}`

  if (walletClient) {
    if (!walletClient.account?.address) {
      throw new Error("La wallet no tiene cuenta activa para firmar el pago.")
    }
    const client = new x402Client()
    client.register(
      "eip155:*",
      new ExactEvmScheme(
        walletClient as unknown as ConstructorParameters<typeof ExactEvmScheme>[0]
      )
    )
    const paidFetch = wrapFetchWithPayment(fetch, client)
    const res = await paidFetch(url)
    if (res.status === 402) {
      await throwPaymentRequiredIf402(res)
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }))
      throw new Error(
        (err as { message?: string }).message ??
          (err as { error?: string }).error ??
          "Error al analizar la billetera"
      )
    }
    const data = (await res.json()) as AnalysisResult
    const tx = extractPaymentTx(res)
    if (tx) data.payment_tx_hash = tx
    return data
  }

  const res = await fetch(url)
  if (res.status === 402) {
    await throwPaymentRequiredIf402(res)
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(
      (err as { message?: string }).message ??
        (err as { error?: string }).error ??
        "Error al analizar la billetera"
    )
  }
  return res.json() as Promise<AnalysisResult>
}
