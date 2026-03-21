import {
  AreaChart,
  Area,
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
}

export function GasEfficiencyChart({ data }: GasEfficiencyChartProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-6">
      <h3 className="mb-1 text-sm font-semibold uppercase tracking-wider text-slate-400">
        Gas gastado por hora (UTC) — datos reales on-chain
      </h3>
      <p className="mb-4 text-xs text-slate-600">
        Total USD de gas por franja horaria, calculado con gas usado × precio
        nativo (AVAX/ETH). Solo datos de tus transacciones, sin estimados.
      </p>
      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gasWallet" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="hour"
              stroke="#475569"
              tick={{ fill: "#94a3b8", fontSize: 12 }}
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
              formatter={(value, name, props) => {
                const payload = props?.payload
                const extra =
                  payload?.tx_count != null
                    ? ` (${payload.tx_count} txs)`
                    : ""
                return [`$${Number(value).toFixed(2)}${extra}`, name]
              }}
              labelFormatter={(label) => `${label} UTC`}
            />
            <Legend wrapperStyle={{ color: "#94a3b8", fontSize: "12px" }} />
            <Area
              type="monotone"
              dataKey="gas_usd"
              name="Gas (USD)"
              stroke="#ef4444"
              fill="url(#gasWallet)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
