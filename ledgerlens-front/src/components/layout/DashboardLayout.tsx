import { Header } from "./Header"
import { useAnalysisStore } from "@/features/analysis/store/useAnalysisStore"
import { IdentityBadge } from "@/features/analysis/components/IdentityBadge"
import { GasEfficiencyChart } from "@/features/analysis/components/GasEfficiencyChart"
import { TransactionTable } from "@/features/analysis/components/TransactionTable"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, Eye, Wallet } from "lucide-react"
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

function WalletStatsSummary({
  transactions,
  isMyWallet,
}: {
  transactions: { gas_usd: number; value_usd?: number }[]
  isMyWallet: boolean
}) {
  if (!isMyWallet || transactions.length === 0) return null
  const totalGas = transactions.reduce((s, t) => s + t.gas_usd, 0)
  const totalVolume = transactions.reduce((s, t) => s + (t.value_usd ?? 0), 0)
  return (
    <div className="flex flex-wrap gap-4 rounded-xl border border-slate-800 bg-slate-900/30 px-4 py-3">
      <span className="text-sm text-slate-400">
        <strong className="text-slate-200">{transactions.length}</strong>{" "}
        transacciones
      </span>
      <span className="text-sm text-slate-400">
        <strong className="text-slate-200">${totalGas.toFixed(2)}</strong> gas
        total
      </span>
      {totalVolume > 0 && (
        <span className="text-sm text-slate-400">
          <strong className="text-slate-200">${totalVolume.toFixed(2)}</strong>{" "}
          volumen estimado
        </span>
      )}
    </div>
  )
}

export function DashboardLayout() {
  const { isLoading, analysisResult, walletAddress, error, fetchAnalysis } =
    useAnalysisStore()
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
              address ? () => fetchAnalysis(address) : undefined
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
              transactions={analysisResult.transactions ?? []}
              isMyWallet={isMyWallet}
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
            </div>

            <IdentityBadge result={analysisResult} />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <GasEfficiencyChart data={analysisResult.gas_efficiency ?? []} />
              <TransactionTable
                chain={analysisResult.chain}
                transactions={analysisResult.transactions ?? []}
              />
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
