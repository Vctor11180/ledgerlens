/**
 * Servicio agregador: transforma data cruda de Avalanche al formato del Frontend
 */

const ACTION_MAP = {
  NATIVE_TRANSFER: "Transfer",
  CONTRACT_CALL: "Swap", // Fallback; METHOD_HASHES puede refinarlo
};

// Method hashes comunes (primeros 4 bytes del selector)
const METHOD_HASHES = {
  "0xa9059cbb": "Transfer",      // ERC20 transfer
  "0x23b872dd": "Transfer",      // ERC721 safeTransferFrom
  "0x095ea7b3": "Approve",       // ERC20 approve
  "0x38ed1739": "Swap",          // Uniswap V2 swapExactTokensForTokens
  "0x8803dbee": "Swap",          // Uniswap V2 swapTokensForExactTokens
  "0x5c11d795": "Swap",          // Uniswap V2 swapExactTokensForTokens (variant)
  "0x7ff36ab5": "Swap",          // Uniswap V2 swapExactETHForTokens
  "0x18cbafe5": "Swap",          // Uniswap V2 swapExactTokensForETH
  "0xfb3bdb41": "Swap",          // Uniswap V2 swapETHForExactTokens
  "0x04e45aaf": "Bridge",        // Bridge (ej. Avalanche Bridge)
  "0x52aa4b22": "Bridge",
};

const AVAX_DECIMALS = 18n;
const GWEI = 10n ** 9n;

/**
 * Procesa transacciones crudas y devuelve el formato esperado por el Frontend + resumen para la IA
 * @param {Array} rawTxArray - Array de objetos extraídos por avalanche.service
 * @param {{ chain?: string }} opts - chain: "avalanche" | "ethereum" para precio nativo correcto
 * @returns {{ formattedTransactions: Array, statisticalSummary: string, gasEfficiency: Array }}
 */
export function processRawTransactions(rawTxArray, opts = {}) {
  const chain = (opts.chain || "avalanche").toLowerCase();
  const nativeUsdPrice =
    chain === "ethereum"
      ? parseFloat(process.env.ETH_USD_PRICE || "3500")
      : parseFloat(process.env.AVAX_USD_PRICE || "35");
  const nativeSymbol = chain === "ethereum" ? "ETH" : "AVAX";
  const formattedTransactions = [];
  const addressCount = new Map();
  const actionCount = new Map();

  for (const raw of rawTxArray) {
    const action = resolveAction(raw);
    const counterparty = formatCounterparty(raw);
    const gasUsd = calculateGasUsd(raw, nativeUsdPrice);
    const { valueNative, valueUsd } = calculateValue(raw, nativeUsdPrice);
    const time = raw.timestamp
      ? new Date(raw.timestamp * 1000).toISOString()
      : new Date().toISOString();

    formattedTransactions.push({
      id: raw.hash || `0x${Math.random().toString(16).slice(2, 10)}`,
      time,
      action,
      counterparty,
      gas_usd: Math.round(gasUsd * 100) / 100,
      value_native: valueNative,
      value_usd: valueUsd,
      native_symbol: nativeSymbol,
    });

    const addr = (raw.to || "unknown").toLowerCase();
    addressCount.set(addr, (addressCount.get(addr) ?? 0) + 1);
    actionCount.set(action, (actionCount.get(action) ?? 0) + 1);
  }

  const statisticalSummary = buildStatisticalSummary(
    rawTxArray,
    formattedTransactions,
    addressCount,
    actionCount,
    chain
  );
  const gasEfficiency = buildGasEfficiency(formattedTransactions);

  return {
    formattedTransactions,
    statisticalSummary,
    gasEfficiency,
  };
}

function resolveAction(raw) {
  const hash = (raw.methodHash || "").toLowerCase();
  if (METHOD_HASHES[hash]) return METHOD_HASHES[hash];
  const callType = raw.callType ?? "";
  return ACTION_MAP[callType] ?? "Swap";
}

function formatCounterparty(raw) {
  const addr = raw.to || "0x0";
  const name = raw.toName || raw.toSymbol;
  const shortAddr = `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  return name ? `${shortAddr} (${name})` : shortAddr;
}

function calculateGasUsd(raw, avaxUsdPrice) {
  const gasUsed = raw.gasUsed ?? 0n;
  const gasPrice = raw.gasPrice ?? 0n;
  const costWei = gasUsed * gasPrice;
  const costAvax = Number(costWei) / Number(10n ** AVAX_DECIMALS);
  return costAvax * avaxUsdPrice;
}

/** Devuelve el valor enviado en la tx (nativo: AVAX/ETH) y en USD. */
function calculateValue(raw, nativeUsdPrice) {
  const valueWei = raw.value ?? 0n;
  const valueNative = Number(valueWei) / Number(10n ** AVAX_DECIMALS);
  const valueUsd = valueNative * nativeUsdPrice;
  return {
    valueNative: Math.round(valueNative * 1e6) / 1e6,
    valueUsd: Math.round(valueUsd * 100) / 100,
  };
}

function buildStatisticalSummary(
  rawTxArray,
  formattedTransactions,
  addressCount,
  actionCount,
  chain = "avalanche"
) {
  const totalTx = rawTxArray.length;
  const totalGasUsd = formattedTransactions.reduce((s, t) => s + t.gas_usd, 0);
  const totalValueUsd = formattedTransactions.reduce((s, t) => s + (t.value_usd ?? 0), 0);
  const avgGasUsd = totalTx > 0 ? (totalGasUsd / totalTx).toFixed(2) : "0";

  const topAddresses = [...addressCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([addr, count]) => `${addr.slice(0, 10)}... (${count} txs)`)
    .join(", ");

  const actionBreakdown = [...actionCount.entries()]
    .map(([action, count]) => `${action}: ${count}`)
    .join("; ");

  const chainLabel = chain === "ethereum" ? "Ethereum" : "Avalanche C-Chain";
  return `Resumen de las últimas ${totalTx} transacciones de una billetera en ${chainLabel}. Total gas gastado: $${totalGasUsd.toFixed(2)} USD. Volumen nativo estimado: $${totalValueUsd.toFixed(2)} USD. Gas promedio por tx: $${avgGasUsd} USD. Direcciones más frecuentes: ${topAddresses || "N/A"}. Desglose de acciones: ${actionBreakdown || "N/A"}.`;
}

/**
 * Agrupa gas por hora (UTC) usando datos reales de las txs.
 * Solo datos on-chain: sin estimados ni promedios inventados.
 */
function buildGasEfficiency(formattedTransactions) {
  const byHour = new Map();

  for (const tx of formattedTransactions) {
    const date = new Date(tx.time);
    const hourKey = `${String(date.getUTCHours()).padStart(2, "0")}:00`;
    const current = byHour.get(hourKey) ?? { totalGas: 0, count: 0 };
    current.totalGas += tx.gas_usd;
    current.count += 1;
    byHour.set(hourKey, current);
  }

  // 24 horas para ver distribución real del día
  const allHours = Array.from({ length: 24 }, (_, i) =>
    `${String(i).padStart(2, "0")}:00`
  );

  return allHours.map((hour) => {
    const entry = byHour.get(hour) ?? { totalGas: 0, count: 0 };
    return {
      hour,
      gas_usd: Math.round(entry.totalGas * 100) / 100,
      tx_count: entry.count,
    };
  });
}
