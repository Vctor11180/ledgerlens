import { useState } from "react"
import { Header } from "./Header"
import { useAnalysisStore } from "@/features/analysis/store/useAnalysisStore"
import { useRunAnalysis } from "@/features/analysis/hooks/useRunAnalysis"
import { IdentityBadge } from "@/features/analysis/components/IdentityBadge"
import { GasEfficiencyChart } from "@/features/analysis/components/GasEfficiencyChart"
import { TransactionTable } from "@/features/analysis/components/TransactionTable"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, Eye, Wallet, ChevronDown } from "lucide-react"
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
  onRunAgent,
  hasConnectedWallet,
}: {
  onAnalyzeMyWallet?: () => void
  onRunAgent?: () => void
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
      <div className="mt-8 border-t border-slate-800/60 pt-8 w-full max-w-md mx-auto">
        <h3 className="text-sm font-semibold text-slate-300 mb-4 text-center">IA Agente Autónomo (x402)</h3>
        <button
          onClick={() => onRunAgent?.()}
          className="inline-flex w-full justify-center items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3 text-sm font-bold text-emerald-400 transition-all hover:bg-emerald-500/20 hover:scale-[1.02] shadow-[0_0_20px_rgba(16,185,129,0.1)] active:scale-95"
        >
          🤖 Ejecutar Escaneo con IA
        </button>
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

import type { AnalysisResult } from "@/lib/analysis.types"

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
  
  const [agentLogs, setAgentLogs] = useState<string[] | null>(null)
  const isMyWallet =
    !!address &&
    !!walletAddress &&
    address.toLowerCase() === walletAddress.toLowerCase()

  const handleRunAgent = async (addrOverride?: string) => {
    // Limpiar el resultado anterior para que se vea la terminal del agente
    useAnalysisStore.setState({ analysisResult: null, error: null })
    setAgentLogs(["Inicializando agente remoto en LedgerLens Network..."]);
    try {
      const url = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? "http://localhost:3001" : "");
      const finalUrl = addrOverride ? `${url}/api/run-agent?address=${addrOverride}` : `${url}/api/run-agent`;
      const res = await fetch(finalUrl);
      const data = await res.json();
      setAgentLogs(prev => [...(prev||[]), ...data.logs.filter((l:string) => !prev?.includes(l)) || ["Agente completó su tarea."]]);
      if (data.report && data.targetWallet) {
        const reportWithPmt = { ...data.report, payment_tx_hash: data.paymentHash };
        useAnalysisStore.setState({ 
          walletAddress: data.targetWallet, 
          analysisResult: reportWithPmt, 
          isLoading: false, 
          error: null 
        })
        // No borramos los logs, los dejamos para la sección de 'Evidencia'
      }
    } catch (e: any) {
      setAgentLogs(prev => [...(prev||[]), "❌ Error de conexión con el agente: " + e.message])
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-950">
      <Header onRunAgent={handleRunAgent} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        {!isLoading && !analysisResult && !error && !agentLogs && (
          <EmptyState
            hasConnectedWallet={!!address}
            onAnalyzeMyWallet={
              address ? () => void runAnalysis(address) : undefined
            }
            onRunAgent={handleRunAgent}
          />
        )}

        {agentLogs && !analysisResult && (
          <div className="mx-auto max-w-2xl rounded-xl border border-slate-800 bg-slate-950 p-6 font-mono text-sm text-slate-300">
            <h3 className="mb-4 text-emerald-400 text-lg font-semibold tracking-tight animate-pulse">🤖 Ejecutando Agente Autónomo...</h3>
            <div className="space-y-3 rounded-lg bg-black px-4 py-4 min-h-[160px]">
              {agentLogs.map((l, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-slate-600 select-none">&gt;</span>
                  <span className={l.includes("Error") || l.includes("❌") || l.includes("Fallo") ? "text-rose-400" : ""}>{l}</span>
                </div>
              ))}
            </div>
          </div>
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
              {analysisResult.payment_tx_hash && (
                <span className="text-slate-400" title="Liquidación x402 (USDC)">
                  Pago:{" "}
                  <a
                    className="font-mono text-emerald-400 underline-offset-2 hover:underline"
                    href={`${
                      String(import.meta.env.VITE_X402_NETWORK ?? "fuji").toLowerCase() ===
                      "mainnet"
                        ? "https://snowtrace.io"
                        : "https://testnet.snowtrace.io"
                    }/tx/${analysisResult.payment_tx_hash}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {analysisResult.payment_tx_hash.slice(0, 10)}…
                  </a>
                </span>
              )}
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

            {agentLogs && (
              <details className="group rounded-xl border border-slate-800 bg-slate-950/50 p-4 transition-all hover:bg-slate-950">
                <summary className="flex cursor-pointer items-center justify-between text-sm font-medium text-slate-400 selection:bg-transparent">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Evidencia de Operación del Agente (x402 Logs)</span>
                  </div>
                  <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                </summary>
                <div className="mt-4 space-y-2 rounded-lg bg-black/50 p-4 font-mono text-xs text-slate-500 max-h-60 overflow-y-auto">
                   {agentLogs.map((l, i) => (
                     <div key={i} className="flex gap-2">
                       <span className="text-slate-800">&gt;</span>
                       <span>{l}</span>
                     </div>
                   ))}
                </div>
              </details>
            )}

            <div className="mx-auto flex max-w-xl flex-col gap-8 lg:max-w-none lg:flex-row lg:items-start lg:gap-8">
              <div className="min-w-0 flex-1 lg:max-w-xl">
                <TransactionTable
                  chain={analysisResult.chain}
                  transactions={analysisResult.transactions ?? []}
                />
              </div>
              <div className="min-w-0 flex-1">
                <GasEfficiencyChart data={analysisResult.gas_efficiency ?? []} />
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
