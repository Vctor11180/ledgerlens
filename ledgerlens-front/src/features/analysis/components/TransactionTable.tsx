import { useMemo } from "react"
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ArrowRightLeft, ExternalLink, Send, ShieldCheck, Waypoints } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Transaction } from "@/lib/analysis.types"
import { getExplorerTxUrl } from "@/lib/explorer"

const columnHelper = createColumnHelper<Transaction>()

const actionIcons: Record<string, React.ReactNode> = {
  Swap: <ArrowRightLeft className="h-4 w-4 text-blue-400" />,
  Transfer: <Send className="h-4 w-4 text-emerald-400" />,
  Approve: <ShieldCheck className="h-4 w-4 text-yellow-400" />,
  Bridge: <Waypoints className="h-4 w-4 text-purple-400" />,
}

interface TransactionTableProps {
  transactions: Transaction[]
  /** Red del análisis (para enlaces Snowtrace / Etherscan) */
  chain?: string
}

export function TransactionTable({ transactions, chain }: TransactionTableProps) {
  const columns = useMemo(
    () => [
      columnHelper.accessor("id", {
        header: "Tx",
        cell: (info) => {
          const hash = info.getValue()
          const url = getExplorerTxUrl(chain, hash)
          const short = `${hash.slice(0, 8)}…${hash.slice(-6)}`
          if (!url) {
            return (
              <span className="font-mono text-xs text-slate-500">{short}</span>
            )
          }
          return (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-mono text-xs text-indigo-400 hover:text-indigo-300 hover:underline"
              title="Abrir en el explorador y validar on-chain"
            >
              {short}
              <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
            </a>
          )
        },
      }),
      columnHelper.accessor("time", {
        header: "Fecha",
        cell: (info) => {
          const iso = info.getValue()
          try {
            const d = new Date(iso)
            const date = d.toLocaleDateString("es", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
            const time = d.toLocaleTimeString("es", {
              hour: "2-digit",
              minute: "2-digit",
            })
            return (
              <span className="font-mono text-xs text-slate-400" title={iso}>
                {date}, {time}
              </span>
            )
          } catch {
            return <span className="font-mono text-xs text-slate-500">{iso}</span>
          }
        },
      }),
      columnHelper.accessor("action", {
        header: "Action",
        cell: (info) => (
          <span className="inline-flex items-center gap-2">
            {actionIcons[info.getValue()] ?? null}
            <span className="text-sm font-medium text-slate-200">
              {info.getValue()}
            </span>
          </span>
        ),
      }),
      columnHelper.accessor("counterparty", {
        header: "Counterparty",
        cell: (info) => (
          <span className="font-mono text-xs text-slate-400">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.display({
        id: "amount",
        header: "Amount",
        cell: (info) => {
          const row = info.row.original
          const native = row.value_native ?? 0
          const symbol = row.native_symbol ?? "AVAX"
          const usd = row.value_usd ?? 0
          if (native === 0 && usd === 0) return (
            <span className="font-mono text-xs text-slate-600">—</span>
          )
          return (
            <span className="font-mono text-xs text-slate-300" title={usd > 0 ? `≈ $${usd.toFixed(2)}` : undefined}>
              {native > 0.000001 ? native.toFixed(6) : native}{" "}
              <span className="text-slate-500">{symbol}</span>
              {usd > 0 && (
                <span className="ml-1 text-slate-500">
                  (${usd.toFixed(2)})
                </span>
              )}
            </span>
          )
        },
      }),
      columnHelper.accessor("gas_usd", {
        header: "Gas (USD)",
        cell: (info) => {
          const val = info.getValue()
          return (
            <span
              className={cn(
                "font-mono text-sm font-semibold",
                val > 5 ? "text-red-400" : "text-slate-300"
              )}
            >
              ${val.toFixed(2)}
            </span>
          )
        },
      }),
    ],
    [chain]
  )

  const table = useReactTable({
    data: transactions,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-6">
      <h3 className="mb-1 text-sm font-semibold uppercase tracking-wider text-slate-400">
        Recent Transactions
      </h3>
      <p className="mb-4 text-xs text-slate-600">
        Hash → explorador. <strong>Amount</strong> = valor nativo (AVAX/ETH) enviado
        en la tx; swaps y transfers de tokens suelen mostrar — porque el value en
        la tx raíz es 0. <strong>Gas</strong> = coste real calculado on-chain.
      </p>
      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow
                key={hg.id}
                className="border-slate-800 bg-slate-900/80 hover:bg-slate-900/80"
              >
                {hg.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-xs font-semibold uppercase tracking-wider text-slate-500"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className="border-slate-800 transition-colors hover:bg-slate-900/60"
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
