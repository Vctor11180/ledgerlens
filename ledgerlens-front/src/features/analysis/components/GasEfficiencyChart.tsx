import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import type { GasDataPoint } from "@/lib/analysis.types"

interface GasEfficiencyChartProps {
  data: GasDataPoint[]
  chain?: string
}

const chartData = (data: GasDataPoint[]) =>
  data.map((d) => ({
    ...d,
    xKey: d.label || d.hour || "-",
  }))

const NATIVE_SYMBOL: Record<string, string> = {
  avalanche: "AVAX",
  fuji: "AVAX",
  ethereum: "ETH",
}

export function GasEfficiencyChart({ data, chain = "avalanche" }: GasEfficiencyChartProps) {
  const plotData = chartData(data).filter((d) => d.label !== "Sin datos" || d.gas_usd > 0)
  const totalGas = plotData.reduce((s, d) => s + (d.gas_usd || 0), 0)
  const totalTxs = plotData.reduce((s, d) => s + (d.tx_count ?? 1), 0)
  const symbol = NATIVE_SYMBOL[chain] ?? "AVAX/ETH"

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-6">
      <h3 className="mb-1 text-sm font-semibold uppercase tracking-wider text-slate-400">
        Gas a lo largo del tiempo
      </h3>
      <p className="mb-2 text-xs text-slate-600">
        Gas (USD) por transacción ordenada cronológicamente. Cálculo: gas usado ×
        precio nativo ({symbol}). Solo tus txs, sin estimados.
      </p>
      <div className="mb-4 flex gap-4 text-xs">
        <span className="text-slate-500">
          Total gas: <strong className="text-slate-300">${totalGas.toFixed(2)}</strong>
        </span>
        <span className="text-slate-500">
          Transacciones: <strong className="text-slate-300">{totalTxs}</strong>
        </span>
      </div>
      <div className="relative h-[260px] w-full">
        {plotData.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-700 bg-slate-900/30 text-sm text-slate-500">
            No hay transacciones con gas para mostrar
          </div>
        ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={plotData}
            margin={{ top: 10, right: 10, left: 5, bottom: 15 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="xKey"
              stroke="#475569"
              tick={{ fill: "#94a3b8", fontSize: 10 }}
              interval={plotData.length > 12 ? Math.max(0, Math.floor(plotData.length / 6) - 1) : 0}
            />
            <YAxis
              stroke="#475569"
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              tickFormatter={(v: number) => `$${v}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                border: "1px solid #334155",
                borderRadius: "8px",
                color: "#e2e8f0",
              }}
              formatter={(value, _name, props) => {
                const p = props?.payload
                const txs = p?.tx_count != null ? ` · ${p.tx_count} txs` : ""
                const act = p?.action ? ` · ${p.action}` : ""
                return [`$${Number(value).toFixed(2)}${txs}${act}`, "Gas (USD)"]
              }}
              labelFormatter={(label) => `Fecha: ${label}`}
            />
            <Legend wrapperStyle={{ color: "#94a3b8", fontSize: "12px" }} />
            <Bar
              dataKey="gas_usd"
              name="Gas (USD)"
              fill="#ef4444"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
