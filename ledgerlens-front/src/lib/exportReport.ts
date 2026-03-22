import { jsPDF } from "jspdf"
import type { AnalysisResult } from "./analysis.types"

export function downloadReportPdf(result: AnalysisResult, walletAddress: string) {
  const doc = new jsPDF({ format: "a4", unit: "mm" })
  const margin = 15
  let y = 20

  const addText = (text: string, size = 10, bold = false) => {
    doc.setFontSize(size)
    doc.setFont("helvetica", bold ? "bold" : "normal")
    const lines = doc.splitTextToSize(text, 180)
    for (const line of lines) {
      if (y > 270) {
        doc.addPage()
        y = 20
      }
      doc.text(line, margin, y)
      y += size * 0.4
    }
    y += 3
  }

  doc.setFillColor(99, 102, 241)
  doc.rect(0, 0, 210, 25, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.text("LedgerLens — Reporte de Análisis", margin, 18)
  doc.setTextColor(0, 0, 0)
  y = 35

  addText(`Dirección: ${walletAddress}`, 10, true)
  addText(`Red: ${result.chain ?? "N/A"}`, 9)
  addText(`Fecha del reporte: ${new Date().toLocaleDateString("es", { dateStyle: "long" })}`, 9)
  y += 5

  addText("Clasificación", 12, true)
  addText(`Identidad: ${result.identity}`, 10)
  addText(`Riesgo: ${result.risk_score}/100`, 10)
  addText(`Narrativa: ${result.narrative}`, 9)
  y += 5

  if (result.wallet_summary) {
    const ws = result.wallet_summary
    const sym = result.chain === "ethereum" ? "ETH" : "AVAX"
    addText("Resumen de fondos", 12, true)
    addText(`Balance: ${ws.current_balance_native?.toFixed(4) ?? 0} ${sym}`, 9)
    addText(`Recibido (USD): $${(ws.total_received_usd ?? 0).toFixed(2)}`, 9)
    addText(`Enviado (USD): $${(ws.total_sent_usd ?? 0).toFixed(2)}`, 9)
    addText(`Gas gastado: $${(ws.total_gas_spent_usd ?? 0).toFixed(2)}`, 9)
    y += 5
  }

  if (result.interaction_breakdown && result.interaction_breakdown.length > 0) {
    addText("Tipos de cuenta con los que interactuaste", 12, true)
    for (const b of result.interaction_breakdown) {
      addText(`· ${b.label}: ${b.count}`, 9)
    }
    y += 5
  }

  addText("Transacciones recientes", 12, true)
  const txs = (result.transactions ?? []).slice(0, 30)
  for (const t of txs) {
    const scamTag = t.is_scam ? " [SOSPECHOSO]" : ""
    addText(`${t.time?.slice(0, 10)} · ${t.action}${scamTag} — $${(t.gas_usd ?? 0).toFixed(2)} gas`, 8)
  }

  if ((result.transactions ?? []).length > 30) {
    addText(`... y ${(result.transactions?.length ?? 0) - 30} transacciones más`, 8)
  }

  addText("— LedgerLens · Aleph Hackathon 2026 · Powered by GenLayer & Avalanche", 8)
  doc.save(`ledgerlens-reporte-${walletAddress.slice(2, 10)}.pdf`)
}
