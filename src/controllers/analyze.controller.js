/**
 * Controlador principal: orquesta Avalanche → Agregador → IA y responde al Frontend
 */

import { fetchTransactions, getSupportedChains } from "../services/avalanche.service.js";
import { processRawTransactions } from "../services/aggregator.service.js";
import { analyzeWalletBehavior } from "../services/ai.service.js";

/**
 * GET /api/analyze/:address
 * Analiza una billetera de Avalanche y devuelve el formato exacto que espera el Frontend
 */
export async function analyzeAddress(req, res) {
  const { address } = req.params;
  const requestedChain = String(req.query.chain || "avalanche").toLowerCase();

  if (!address || typeof address !== "string") {
    return res.status(400).json({
      error: "Dirección requerida",
      message: "Proporciona una dirección de billetera en /api/analyze/:address",
    });
  }

  const trimmed = address.trim();
  if (!trimmed.startsWith("0x") || trimmed.length !== 42) {
    return res.status(400).json({
      error: "Dirección inválida",
      message: "La dirección debe ser una dirección EVM válida (0x + 40 caracteres hex).",
    });
  }

  const supportedChains = getSupportedChains();
  if (!supportedChains.includes(requestedChain)) {
    return res.status(400).json({
      error: "Chain inválida",
      message: `Chain soportadas: ${supportedChains.join(", ")}`,
    });
  }

  try {
    const rawTxs = await fetchTransactions(trimmed, requestedChain);

    if (!rawTxs || rawTxs.length === 0) {
      return res.status(200).json({
        identity: "Unknown",
        risk_score: 0,
        narrative:
          `No se encontraron transacciones recientes para esta billetera en ${requestedChain}. No es posible realizar un análisis de comportamiento.`,
        chain: requestedChain,
        transactions: [],
        gas_efficiency: [],
      });
    }

    const {
      formattedTransactions,
      statisticalSummary,
      gasEfficiency,
    } = processRawTransactions(rawTxs, { chain: requestedChain });

    const aiVerdict = await analyzeWalletBehavior(statisticalSummary);

    const response = {
      identity: aiVerdict.identity,
      risk_score: aiVerdict.risk_score,
      narrative: aiVerdict.narrative,
      chain: requestedChain,
      transactions: formattedTransactions,
      gas_efficiency: gasEfficiency,
    };

    return res.status(200).json(response);
  } catch (err) {
    console.error("[analyze] Error:", err.message);

    const status =
      err.message.includes("GLACIER") ||
      err.message.includes("OpenAI") ||
      err.message.includes("GenLayer")
        ? 503
        : 500;

    return res.status(status).json({
      error: "Error al analizar la billetera",
      message: err.message,
    });
  }
}
