import { useMemo, useState } from "react"
import {
  ArrowDownLeft,
  ArrowUpRight,
  CircleDot,
  ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Transaction } from "@/lib/analysis.types"
import { getExplorerTxUrl } from "@/lib/explorer"

interface TransactionTableProps {
  transactions: Transaction[]
  chain?: string
}

function formatAmountTrim(n: number): string {
  if (!Number.isFinite(n) || n === 0) return "0"
  const a = Math.abs(n)
  if (a >= 0.0001) {
    return a.toLocaleString("es-ES", { maximumFractionDigits: 6 })
  }
  return a.toExponential(2)
}

function activityPrimaryLine(t: Transaction): string {
  const flow = t.flow ?? "neutral"
  const hasTok =
    t.token_amount != null && t.token_amount > 0 && t.token_symbol
  const sym = hasTok ? t.token_symbol : t.native_symbol ?? "AVAX"
  const amt = hasTok ? (t.token_amount ?? 0) : t.value_native ?? 0
  const hasAmount =
    hasTok || (t.value_native != null && Math.abs(t.value_native) > 1e-18)

  if (!hasAmount || flow === "neutral") {
    const a = t.action
    return a.length > 56 ? `${a.slice(0, 55)}…` : a
  }

  const num = formatAmountTrim(amt)
  return flow === "out"
    ? `${num} ${sym} enviados`
    : `${num} ${sym} recibidos`
}

function primaryUsd(t: Transaction): number | null {
  if (t.token_amount && t.token_amount > 0) {
    if (t.token_value_usd != null && t.token_value_usd > 0) return t.token_value_usd
    if (t.value_usd != null && t.value_usd > 0) return t.value_usd
    return null
  }
  if (t.value_usd != null && t.value_usd > 0) return t.value_usd
  return null
}

/** Muestra decimales extra cuando el importe es pequeño (como en Core). */
function formatUsdDisplay(n: number): string {
  const abs = Math.abs(n)
  if (abs < 0.01 && abs > 0) {
    return abs.toLocaleString("es-ES", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    })
  }
  if (abs < 1) {
    return abs.toLocaleString("es-ES", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    })
  }
  return abs.toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function capitalizeHeading(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function groupByMonth(transactions: Transaction[]) {
  const groups: { heading: string; txs: Transaction[] }[] = []
  for (const tx of transactions) {
    const d = new Date(tx.time)
    const heading = capitalizeHeading(
      d.toLocaleDateString("es", { month: "long", year: "numeric" })
    )
    const last = groups[groups.length - 1]
    if (last && last.heading === heading) {
      last.txs.push(tx)
    } else {
      groups.push({ heading, txs: [tx] })
    }
  }
  return groups
}

export function TransactionTable({ transactions, chain }: TransactionTableProps) {
  const [showScam, setShowScam] = useState(false)

  const { filteredTxs, scamCount } = useMemo(() => {
    let count = 0
    const filtered = transactions.filter((t) => {
      if (t.is_scam) {
        count++
        return showScam
      }
      return true
    })
    return { filteredTxs: filtered, scamCount: count }
  }, [transactions, showScam])

  const groups = useMemo(() => groupByMonth(filteredTxs), [filteredTxs])

  if (transactions.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-6">
        <h3 className="mb-1 text-lg font-semibold text-slate-100">Actividad</h3>
        <p className="text-sm text-slate-500">Sin transacciones recientes.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 sm:p-6">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="mb-1 text-lg font-semibold tracking-tight text-slate-100">
            Actividad
          </h3>
          <p className="text-xs text-slate-600">
            USD aproximado según el indexador. Detalle en el explorador.
          </p>
        </div>
        
        {scamCount > 0 && (
          <button
            onClick={() => setShowScam((s) => !s)}
            className="self-start sm:self-auto rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1.5 text-xs font-medium text-orange-400 transition-colors hover:bg-orange-500/20"
            title="Incluye: posibles estafas (caracteres sospechosos) y transferencias sin valor (fallidas/spam)"
          >
            {showScam ? "Ocultar" : "Ver"} {scamCount} sospechosas
          </button>
        )}
      </div>

      <div className="space-y-8">
        {groups.map((g) => (
          <section key={g.heading}>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              {g.heading}
            </h4>
            <ul className="divide-y divide-slate-800/90 overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40">
              {g.txs.map((t) => (
                <ActivityRow key={t.id} tx={t} chain={chain} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}

function ActivityRow({ tx, chain }: { tx: Transaction; chain?: string }) {
  const flow = tx.flow ?? "neutral"
  const title = activityPrimaryLine(tx)
  const usd = primaryUsd(tx)
  const url = getExplorerTxUrl(chain, tx.id)
  const d = new Date(tx.time)
  const timeStr = d.toLocaleString("es", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })

  const icon =
    flow === "in" ? (
      <ArrowDownLeft className="h-4 w-4 text-emerald-400" aria-hidden />
    ) : flow === "out" ? (
      <ArrowUpRight className="h-4 w-4 text-rose-400" aria-hidden />
    ) : (
      <CircleDot className="h-4 w-4 text-slate-500" aria-hidden />
    )

  return (
    <li>
      <div className="flex items-center gap-3 px-3 py-3 sm:gap-4">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
            flow === "in" && "bg-emerald-950/60",
            flow === "out" && "bg-rose-950/50",
            flow === "neutral" && "bg-slate-800/90"
          )}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p
              className={cn(
                "truncate text-[15px] font-medium leading-snug",
                tx.is_scam
                  ? "text-orange-400/80 line-through decoration-orange-500/50"
                  : "text-slate-100"
              )}
            >
              {title}
            </p>
            {tx.is_scam && (
              <span
                className={cn(
                  "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                  tx.scam_reason === "zero_value"
                    ? "bg-amber-950/50 text-amber-400"
                    : "bg-orange-950/50 text-orange-400"
                )}
                title={
                  tx.scam_reason === "cyrillic_token"
                    ? "Token con caracteres sospechosos (posible estafa)"
                    : tx.scam_reason === "cyrillic_action"
                      ? "Etiqueta con caracteres sospechosos (posible estafa)"
                      : tx.scam_reason === "zero_value"
                        ? "Transferencia sin valor (fallida, spam o dust)"
                        : "Posible actividad sospechosa"
                }
              >
                {tx.scam_reason === "cyrillic_token" || tx.scam_reason === "cyrillic_action"
                  ? "ESTAFA"
                  : tx.scam_reason === "zero_value"
                    ? "SIN VALOR"
                    : "SCAM"}
              </span>
            )}
          </div>
          {usd != null && (
            <p
              className={cn(
                "mt-0.5 text-xs font-medium tabular-nums",
                flow === "in" && "text-emerald-400",
                flow === "out" && "text-rose-400",
                flow === "neutral" && "text-slate-500"
              )}
            >
              {flow === "in" && "+"}
              {flow === "out" && "−"}
              ${formatUsdDisplay(usd)}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <time
            dateTime={tx.time}
            className="text-right text-[11px] tabular-nums text-slate-500 sm:text-xs"
          >
            {timeStr}
          </time>
          {url ? (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-300"
              title="Ver en el explorador"
              aria-label="Abrir transacción en el explorador"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          ) : null}
        </div>
      </div>
    </li>
  )
}
