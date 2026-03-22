import { Header } from "./Header"
import { useAnalysisStore } from "@/features/analysis/store/useAnalysisStore"
import { useRunAnalysis } from "@/features/analysis/hooks/useRunAnalysis"
import { IdentityBadge } from "@/features/analysis/components/IdentityBadge"
import { GasEfficiencyChart } from "@/features/analysis/components/GasEfficiencyChart"
import { TransactionTable } from "@/features/analysis/components/TransactionTable"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, Eye, Wallet, Download, CreditCard } from "lucide-react"
import { useConnection } from "wagmi"


function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-800 p-6">
        <div className="flex items-start gap-5">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
      <Skeleton className="h-[320px] rounded-xl" />
      <Skeleton className="h-[280px] rounded-xl" />
    </div>
  )
}

function EmptyState({
  onAnalyzeMyWallet,
  hasConnectedWallet,
}: {
  onAnalyzeMyWallet?: () => void
  hasConnectedWallet?: boolean
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-900 ring-1 ring-slate-800">
        <Eye className="h-10 w-10 text-indigo-400" />
      </div>
      <div className="max-w-md space-y-2">
        <h2 className="text-2xl font-bold text-slate-100">
          Financial Intelligence Dashboard
        </h2>
        <p className="text-sm leading-relaxed text-slate-400">
          Pega una dirección EVM y elige Avalanche o Ethereum. Los datos vienen
          de Glacier + el backend; el análisis lo genera la IA configurada en
          el servidor (sin datos ficticios en pantalla).
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {hasConnectedWallet && onAnalyzeMyWallet && (
          <button
            type="button"
            onClick={onAnalyzeMyWallet}
            className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
          >
            <Wallet className="h-4 w-4" />
            Analizar mi wallet conectada
          </button>
        )}
        <div className="flex items-center gap-2 rounded-full border border-dashed border-slate-800 bg-slate-900/30 px-4 py-2">
          <Search className="h-4 w-4 text-slate-600" />
          <span className="text-xs text-slate-600">
            O pega una dirección:{" "}
            <span className="font-mono text-slate-500">0x… (42 caracteres)</span>
          </span>
        </div>
      </div>
      {hasConnectedWallet && (
        <div className="mt-4 flex max-w-md items-start gap-2 rounded-lg border border-emerald-500/20 bg-emerald-950/10 px-4 py-2 text-left text-xs text-slate-400">
          <CreditCard className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
          <span>
            <strong className="text-emerald-400">x402:</strong> Con wallet conectada puedes pagar análisis en USDC (Fuji/C-Chain) cuando el servidor requiera cobro.
          </span>
        </div>
      )}
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-6 text-center">
      <p className="text-sm text-red-300">{message}</p>
    </div>
  )
}

import type { AnalysisResult } from "@/lib/analysis.types"
import { downloadReportPdf } from "@/lib/exportReport"

function WalletStatsSummary({
  result,
}: {
  result: AnalysisResult;
}) {
  if (!result || !result.wallet_summary) return null;
  const { current_balance_native, total_received_usd, total_sent_usd, total_gas_spent_usd } = result.wallet_summary;
  const symbol = result.chain === "ethereum" ? "ETH" : "AVAX";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 rounded-xl border border-slate-800 bg-slate-900/30 p-4">
      <div className="flex flex-col gap-1">
        <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Lo que hay (Balance actual)</span>
        <span className="text-xl text-slate-200 font-bold">
          {current_balance_native.toFixed(4)} {symbol}
        </span>
      </div>
      <div className="flex flex-col gap-1 border-t sm:border-t-0 sm:border-l border-slate-800 sm:pl-4 pt-3 sm:pt-0">
        <span className="text-xs text-emerald-500/80 uppercase tracking-wider font-semibold">Lo que recibí (USD aprox)</span>
        <span className="text-xl text-emerald-400 font-bold">
          ${total_received_usd.toFixed(2)}
        </span>
      </div>
      <div className="flex flex-col gap-1 border-t sm:border-t-0 sm:border-l border-slate-800 sm:pl-4 pt-3 sm:pt-0">
        <span className="text-xs text-rose-500/80 uppercase tracking-wider font-semibold">Lo que envié (USD aprox)</span>
        <span className="text-xl text-rose-400 font-bold">
          ${total_sent_usd.toFixed(2)}
        </span>
      </div>
      <div className="flex flex-col gap-1 border-t sm:border-t-0 sm:border-l border-slate-800 sm:pl-4 pt-3 sm:pt-0">
        <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Gas Gastado (Real)</span>
        <span className="text-xl text-slate-300 font-bold">
          ${(total_gas_spent_usd || 0).toFixed(2)}
        </span>
      </div>
    </div>
  )
}

export function DashboardLayout() {
  const { isLoading, analysisResult, walletAddress, error } = useAnalysisStore()
  const runAnalysis = useRunAnalysis()
  const { address } = useConnection()

  const isMyWallet =
    !!address &&
    !!walletAddress &&
    address.toLowerCase() === walletAddress.toLowerCase()

  return (
    <div className="flex min-h-screen flex-col bg-slate-950">
      <Header />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        {!isLoading && !analysisResult && !error && (
          <EmptyState
            hasConnectedWallet={!!address}
            onAnalyzeMyWallet={
              address ? () => void runAnalysis(address) : undefined
            }
          />
        )}

        {error && !isLoading && <ErrorState message={error} />}

        {isLoading && (
          <div className="space-y-4">
            <p className="text-center text-sm text-slate-500">
              Analizando{" "}
              <span className="font-mono text-indigo-400">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </span>{" "}
              (API + IA)…
            </p>
            <LoadingSkeleton />
          </div>
        )}

        {analysisResult && !isLoading && (
          <div className="space-y-6">
            <WalletStatsSummary
              result={analysisResult}
            />
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>Análisis para</span>
              <code className="rounded bg-slate-900 px-2 py-0.5 font-mono text-indigo-400">
                {walletAddress}
              </code>
              {isMyWallet && (
                <span className="rounded-full bg-emerald-900/40 px-2 py-0.5 text-emerald-400">
                  Mi wallet
                </span>
              )}
              {analysisResult.chain && (
                <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 font-medium capitalize text-slate-300">
                  {analysisResult.chain}
                </span>
              )}
              {analysisResult.payment_tx_hash && (
                <a
                  href={`${analysisResult.chain === "ethereum" ? "https://etherscan.io" : analysisResult.chain === "fuji" ? "https://testnet.snowtrace.io" : "https://snowtrace.io"}/tx/${analysisResult.payment_tx_hash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-400 hover:bg-emerald-500/20"
                  title="Pago realizado vía x402 (USDC)"
                >
                  <CreditCard className="h-3 w-3" />
                  x402 · Pago USDC
                </a>
              )}
              <button
                type="button"
                onClick={() => downloadReportPdf(analysisResult, walletAddress)}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-600 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-slate-100 transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                Descargar PDF
              </button>
            </div>

            {analysisResult.payment_tx_hash && (
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-950/20 px-4 py-2 text-xs text-slate-400">
                <span className="font-semibold text-emerald-400">x402:</span> Este análisis fue pagado con USDC. Conecta tu wallet para pagar vía x402 cuando el servidor requiera cobro (Fuji o C-Chain).
              </div>
            )}

            {analysisResult.interaction_breakdown && analysisResult.interaction_breakdown.length > 0 && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
                  Tipos de cuenta con los que has interactuado
                </h3>
                <div className="flex flex-wrap gap-3">
                  {analysisResult.interaction_breakdown.map((b) => (
                    <span
                      key={b.type}
                      className="rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm"
                    >
                      <span className="font-medium text-slate-300">{b.label}</span>
                      <span className="ml-2 text-slate-500">{b.count}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <IdentityBadge result={analysisResult} />

            <div className="mx-auto flex max-w-xl flex-col gap-8 lg:max-w-none lg:flex-row lg:items-start lg:gap-8">
              <div className="min-w-0 flex-1 lg:max-w-xl">
                <TransactionTable
                  chain={analysisResult.chain}
                  transactions={analysisResult.transactions ?? []}
                />
              </div>
              <div className="min-w-0 flex-1">
                <GasEfficiencyChart
                  data={analysisResult.gas_efficiency ?? []}
                  chain={analysisResult.chain}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-800 py-4 text-center text-xs text-slate-600">
        LedgerLens — Aleph Hackathon 2026 · Powered by GenLayer &amp; Avalanche
      </footer>
    </div>
  )
}
