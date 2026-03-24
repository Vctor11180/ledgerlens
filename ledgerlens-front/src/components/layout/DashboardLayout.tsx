import { Header } from "./Header"
import { useAnalysisStore } from "@/features/analysis/store/useAnalysisStore"
import { useRunAnalysis } from "@/features/analysis/hooks/useRunAnalysis"
import { IdentityBadge } from "@/features/analysis/components/IdentityBadge"
import { GasEfficiencyChart } from "@/features/analysis/components/GasEfficiencyChart"
import { MoneyFlowChart } from "@/features/analysis/components/MoneyFlowChart"
import { TransactionTable } from "@/features/analysis/components/TransactionTable"
import {
  Download,
  CreditCard,
  Search,
  Fingerprint,
  Eye,
  Wallet,
  AlertTriangle,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useEffect, useRef, useState } from "react"
import { useConnection } from "wagmi"
import { AiNarrativeTerminal } from "@/features/analysis/components/AiNarrativeTerminal"


function LoadingSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 animate-pulse">
      {/* Classified Header */}
      <div className="flex flex-col items-center gap-2 mb-4">
        <div className="flex items-center gap-3 px-4 py-1 border border-red-500/20 bg-red-500/5">
          <AlertTriangle className="h-3 w-3 text-red-500" />
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-red-500">
            RESTRICTED_ACCESS: DECRYPTING_NEURAL_LOGS
          </span>
        </div>
      </div>

      {/* Technical Terminal Box */}
      <div className="w-full max-w-2xl rounded-xl border border-white/5 bg-black/40 p-8 shadow-2xl backdrop-blur-xl">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              STATUS: ESTABLISHING_SECURE_LINK...
            </span>
            <span className="text-[10px] font-mono text-emerald-500">72.4% COMPLETE</span>
          </div>
          
          {/* Simulated Progress Bar */}
          <div className="h-1.5 w-full bg-white/5 overflow-hidden">
            <div className="h-full bg-white/40 animate-[loading-bar_2s_infinite]" />
          </div>

          <div className="space-y-2 font-mono text-[10px] text-slate-400">
            <div className="flex gap-4">
              <span className="text-slate-600">[0.001s]</span>
              <span>&gt; CONNECTING_TO_GLACIER_NODE... OK</span>
            </div>
            <div className="flex gap-4">
              <span className="text-slate-600">[0.045s]</span>
              <span>&gt; PARSING_BLOCKCHAIN_SEQUENCES... OK</span>
            </div>
            <div className="flex gap-4">
              <span className="text-slate-600">[0.122s]</span>
              <span>&gt; ANALYZING_IDENTITY_PATTERNS... IN_PROGRESS</span>
            </div>
            <div className="flex gap-4 opacity-50">
              <span className="text-slate-600">[0.211s]</span>
              <span>&gt; GENERATING_AI_NARRATIVE... PENDING</span>
            </div>
          </div>
        </div>
      </div>

      <div className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">
        L37-PRISMA-SECURE-ENCLAVE — DO NOT INTERRUPT
      </div>
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
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const lensRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!lensRef.current) return
      const rect = lensRef.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      
      // Calculate delta and limit to a small range (e.g., 6px)
      const deltaX = (e.clientX - centerX) / 25
      const deltaY = (e.clientY - centerY) / 25
      
      // Smooth clamping
      const limit = 6
      const clampedX = Math.max(-limit, Math.min(limit, deltaX))
      const clampedY = Math.max(-limit, Math.min(limit, deltaY))
      
      setMousePos({ x: clampedX, y: clampedY })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  return (
    <div className="flex min-h-[75vh] flex-col items-center justify-center gap-10 text-center relative z-10">
      {/* Camera Lens Focus Area */}
      <div className="relative mb-8 group" ref={lensRef}>
        {/* Orbital Ring - Moving Circle */}
        <div className="absolute inset-0 -m-8 rounded-full border border-white/5 animate-spin-slow-very pointer-events-none" />
        <div className="absolute inset-0 -m-8 border-t border-white/20 rounded-full animate-spin-slow-very pointer-events-none" />
        
        {/* Main Lens Body */}
        <div className="relative h-20 w-20 flex items-center justify-center rounded-full bg-card ring-1 ring-border shadow-[0_0_50px_rgba(var(--accent-rgb),0.1)] overflow-hidden">
          {/* Glass Reflection */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
          
          {/* The Blinking and Tracking Eye */}
          <div 
            style={{ 
              transform: `translate(${mousePos.x}px, ${mousePos.y}px)`,
              transition: 'transform 0.1s ease-out'
            }}
          >
            <Eye className="h-10 w-10 text-foreground animate-blink" />
          </div>
          
          {/* Subtle Scanlines inside lens */}
          <div className="absolute inset-0 scanline-overlay opacity-10" />
        </div>

        {/* Tactical Crosshairs */}
        <div className="absolute -top-4 -left-4 w-4 h-4 border-t border-l border-white/40" />
        <div className="absolute -top-4 -right-4 w-4 h-4 border-t border-r border-white/40" />
        <div className="absolute -bottom-4 -left-4 w-4 h-4 border-b border-l border-white/40" />
        <div className="absolute -bottom-4 -right-4 w-4 h-4 border-b border-r border-white/40" />
      </div>

      <div className="space-y-6">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-card/40 backdrop-blur-sm">
            <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-bold font-display">
              Neural Network Online
            </span>
          </div>
          <h1 className="text-8xl sm:text-[10rem] font-black text-foreground tracking-prisma relative leading-tight">
            PRISMA
          </h1>
        </div>
        
        <p className="max-w-2xl text-[10px] sm:text-[11px] leading-relaxed tracking-[0.2em] text-slate-500 font-bold uppercase mx-auto px-4 font-display">
          AI-Driven Intelligence Engine.<br />
          Detect Bots. Assess Risk. Track Capital Flows.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-4">
        {hasConnectedWallet && onAnalyzeMyWallet && (
          <button
            type="button"
            onClick={onAnalyzeMyWallet}
            className="h-12 inline-flex items-center gap-3 bg-white px-8 text-[11px] font-black tracking-widest text-slate-950 transition-all hover:bg-slate-200 active:scale-95 shadow-xl shadow-white/5 font-display"
          >
            <Wallet className="h-4 w-4" strokeWidth={3} />
            SCAN CONNECTED WALLET
          </button>
        )}
        
        <div className="h-12 inline-flex items-center gap-3 border border-white/10 bg-white/5 px-8 text-[11px] font-black tracking-widest text-slate-500 font-display">
          <Search className="h-4 w-4" />
          PASTE ADDRESS ABOVE TO BEGIN
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

  const volumeUsd = (total_received_usd || 0) + (total_sent_usd || 0)
  const netFlowUsd = (total_received_usd || 0) - (total_sent_usd || 0)

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 rounded-xl border border-slate-800 bg-slate-900/30 p-4">
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
        <div className="flex flex-col gap-1 border-t sm:border-t-0 sm:border-l border-slate-800 sm:pl-4 pt-3 sm:pt-0">
          <span className="text-xs text-indigo-400/80 uppercase tracking-wider font-semibold">Fondos estimados (USD)</span>
          <span className={cn(
            "text-xl font-bold",
            netFlowUsd >= 0 ? "text-emerald-400" : "text-rose-400"
          )}>
            {netFlowUsd >= 0 ? "+" : ""}${netFlowUsd.toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5">
            Flujo neto (recibido − enviado). Volumen total: ${volumeUsd.toFixed(2)} USD.
          </span>
        </div>
      </div>
      <p className="text-xs text-slate-500">
        <strong className="text-slate-400">Volumen estimado:</strong> Transacciones legítimas (recibido + enviado) = <strong className="text-slate-300">${volumeUsd.toFixed(2)} USD</strong>. Las marcadas como sospechosas no se incluyen.
      </p>
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
    <div className="flex min-h-screen flex-col bg-background text-foreground relative overflow-hidden font-sans transition-colors duration-300">
      {/* Global Scanline Overlay */}
      <div className="absolute inset-0 pointer-events-none z-50 scanline-overlay opacity-[0.03] dark:opacity-[0.02]" />
      
      {/* Biometric Background Layers */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <Fingerprint 
          className="absolute -bottom-24 -right-24 h-[600px] w-[600px] text-accent/10 animate-pulse-slow" 
          strokeWidth={0.5}
        />
        <Fingerprint 
          className="absolute -top-32 -left-32 h-[400px] w-[400px] text-accent/5 animate-spin-slow-very" 
          strokeWidth={0.5}
        />
      </div>

      <Header />

      <main className="flex-1 px-4 py-8 sm:px-6 relative z-10 w-full max-w-[1400px] mx-auto transition-all">
        {/* Terminal Corner Marks (HUD) */}
        <div className="absolute top-4 left-4 h-8 w-8 border-t border-l border-border rounded-tl-lg pointer-events-none" />
        <div className="absolute top-4 right-4 h-8 w-8 border-t border-r border-border rounded-tr-lg pointer-events-none" />
        <div className="absolute bottom-4 left-4 h-8 w-8 border-b border-l border-border rounded-bl-lg pointer-events-none" />
        <div className="absolute bottom-4 right-4 h-8 w-8 border-b border-r border-border rounded-br-lg pointer-events-none" />

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
              <code className="rounded bg-muted px-2 py-0.5 font-mono text-accent">
                {walletAddress}
              </code>
              {isMyWallet && (
                <>
                  <span className="rounded-full bg-emerald-900/40 px-2 py-0.5 text-emerald-400">
                    Mi wallet
                  </span>
                  <span className="text-slate-500" title="Con wallet conectada ves balance en tiempo real y puedes pagar vía x402">
                    (más info con wallet conectada)
                  </span>
                </>
              )}
              {analysisResult.chain && (
                <span className="rounded-full border border-border bg-card px-2 py-0.5 font-medium capitalize text-foreground">
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
              <div className="rounded-xl border border-border bg-card/30 p-4">
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

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-1">
                <IdentityBadge result={analysisResult} address={address || ""} />
              </div>
              <div className="lg:col-span-2">
                <AiNarrativeTerminal
                  result={analysisResult}
                  address={walletAddress}
                />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="min-w-0">
                <GasEfficiencyChart
                  data={analysisResult.gas_efficiency ?? []}
                />
              </div>
              <div className="min-w-0">
                <MoneyFlowChart
                  data={analysisResult.money_flow ?? []}
                />
              </div>
              <div className="min-w-0">
                {/* Protocol Alerts Placeholder to match image */}
                <div className="rounded-xl border border-border bg-card p-6 h-full min-h-[220px]">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-4 block">
                    Protocol Alerts
                  </span>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded bg-red-500/10 border-l-2 border-red-500">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <div className="flex-1">
                        <p className="text-[10px] font-black uppercase text-white">High Risk Approval</p>
                        <p className="text-[9px] text-slate-500 font-mono">Contract 0x44...901</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded bg-white/5 border-l-2 border-white/20">
                      <Zap className="h-4 w-4 text-slate-400" />
                      <div className="flex-1">
                        <p className="text-[10px] font-black uppercase text-white">Whale Transfer</p>
                        <p className="text-[9px] text-slate-500 font-mono">5,000 AVAX -&gt; Coinbase</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <TransactionTable
              chain={analysisResult.chain}
              transactions={analysisResult.transactions ?? []}
            />
          </div>
        )}
      </main>

      <footer className="border-t border-border py-4 px-6 relative z-10">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 font-mono">
            PRISMA © 2026
          </span>
          <div className="flex items-center gap-6">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 font-mono">
              PRISMA CORE V.1.0
            </span>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">
                System Operational
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
