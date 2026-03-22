/**
 * Servicio agregador: transforma data cruda de Avalanche al formato del Frontend.
 * Las etiquetas salen de datos del indexador (Glacier): methodName, callType, selector, ERC-20.
 * No usamos categorías genéricas tipo “mock”; DEX por selector → “DEX router call”.
 */

const AVAX_DECIMALS = 18n;

/** Evita que montos bajos (menos de ~1 céntimo USD) se redondeen a $0.00 en la lista tipo wallet. */
function roundUsd(usd) {
  if (!Number.isFinite(usd) || usd === 0) return 0;
  if (usd < 0.01) return Math.round(usd * 1e6) / 1e6;
  if (usd < 1) return Math.round(usd * 1e4) / 1e4;
  return Math.round(usd * 100) / 100;
}

const DEX_SELECTORS = new Set([
  "0x38ed1739",
  "0x8803dbee",
  "0x5c11d795",
  "0x7ff36ab5",
  "0x18cbafe5",
  "0xfb3bdb41",
]);

function normalizeCallType(ct) {
  let x = String(ct ?? "").toUpperCase();
  if (x === "CONTRACTCALL") return "CONTRACT_CALL";
  if (x === "NATIVETRANSFER") return "NATIVE_TRANSFER";
  return x;
}

function truncateLabel(s, max = 72) {
  const t = String(s).trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

/** methodName del indexador a veces es solo “Contract Call”; preferimos el ERC-20 si hay movimiento. */
function isVagueMethodName(name) {
  const t = String(name || "").trim();
  if (!t) return true;
  return /^(contract\s*call|unknown|call|contractcall)$/i.test(t);
}

/**
 * Texto mostrado en la columna Action: solo inferencia a partir de datos Glacier.
 */
function deriveActionLabel(raw, chain) {
  const hash = (raw.methodHash || "").toLowerCase();
  const callType = normalizeCallType(raw.callType);
  const methodName = String(raw.methodName || "").trim();
  const nativeSym = chain === "ethereum" ? "ETH" : "AVAX";
  const erc20 = raw.primaryErc20;

  if (hash === "0xa9059cbb") {
    return erc20?.symbol ? `${erc20.symbol} · transfer` : "ERC-20 transfer";
  }
  if (hash === "0x23b872dd") {
    return erc20?.symbol ? `${erc20.symbol} · transfer` : "ERC-721 / token transfer";
  }
  if (hash === "0x095ea7b3") return "Token approve";

  if (DEX_SELECTORS.has(hash)) return "DEX router call";

  if (hash === "0x04e45aaf" || hash === "0x52aa4b22") return "Bridge call";

  if (callType === "NATIVE_TRANSFER" || methodName === "Native Transfer") {
    return `${nativeSym} transfer`;
  }

  /**
   * Tx al contrato del token (selector transfer) vs tx a otra app que ejecuta
   * transfer interno: si hay movimiento ERC-20 y el nombre del método es genérico,
   * alineamos con wallets tipo Core (“N USDC …”).
   */
  if (erc20?.symbol && (erc20.amountHuman ?? 0) > 0 && isVagueMethodName(methodName)) {
    return `${erc20.symbol} · transfer`;
  }

  if (methodName && methodName !== "Native Transfer" && !isVagueMethodName(methodName)) {
    return truncateLabel(methodName);
  }

  if (erc20?.symbol && (erc20.amountHuman ?? 0) > 0) {
    return `${erc20.symbol} · transfer`;
  }

  if (callType === "CONTRACT_CALL" || callType === "CALL") {
    return "Contract call";
  }

  if (callType === "TRANSFER") {
    return `${nativeSym} transfer`;
  }

  return "On-chain";
}

/**
 * Entrada/salida respecto a la wallet analizada (como en Core: enviado / recibido).
 */
function deriveFlow(raw, walletLower) {
  if (!walletLower) return "neutral";
  const w = walletLower.toLowerCase();
  const from = (raw.from || "").toLowerCase();
  const to = (raw.to || "").toLowerCase();
  const e = raw.primaryErc20;

  if (e?.direction === "in" || e?.direction === "out") {
    return e.direction;
  }

  const valueWei = raw.value ?? 0n;
  if (valueWei > 0n) {
    if (from === w) return "out";
    if (to === w) return "in";
  }

  return "neutral";
}

/**
 * Procesa transacciones crudas y devuelve el formato esperado por el Frontend + resumen para la IA
 * @param {Array} rawTxArray - Array de objetos extraídos por avalanche.service
 * @param {{ chain?: string, walletAddress?: string }} opts - walletAddress: para sentido in/out
 * @returns {{ formattedTransactions: Array, statisticalSummary: string, gasEfficiency: Array }}
 */
export function processRawTransactions(rawTxArray, opts = {}) {
  const chain = (opts.chain || "avalanche").toLowerCase();
  const walletLower = (opts.walletAddress || "").toLowerCase();
  const nativeUsdPrice =
    chain === "ethereum"
      ? parseFloat(process.env.ETH_USD_PRICE || "3500")
      : parseFloat(process.env.AVAX_USD_PRICE || "35");
  const nativeSymbol = chain === "ethereum" ? "ETH" : "AVAX";
  const formattedTransactions = [];
  const addressCount = new Map();
  const actionCount = new Map();

  let totalReceivedUsd = 0;
  let totalSentUsd = 0;
  let totalGasSpentUsd = 0;

  const containsCyrillic = (str) => /[\u0400-\u04FF]/.test(str || "");

  for (let txIndex = 0; txIndex < rawTxArray.length; txIndex++) {
    const raw = rawTxArray[txIndex];
    const action = deriveActionLabel(raw, chain);
    const counterparty = formatCounterparty(raw);
    const flow = deriveFlow(raw, walletLower);
    const gasUsd = calculateGasUsd(raw, nativeUsdPrice);
    const values = mergeNativeAndErc20Display(raw, nativeUsdPrice, nativeSymbol);
    const time = raw.timestamp
      ? new Date(raw.timestamp * 1000).toISOString()
      : new Date().toISOString();

    const isZeroValueSpam = 
      (values.valueNative === 0 || values.valueNative === undefined) &&
      (values.tokenAmount === 0 || values.tokenAmount === undefined) &&
      action.toLowerCase().includes("transfer");

    const hasCyrillicToken = containsCyrillic(values.tokenSymbol);
    const hasCyrillicAction = containsCyrillic(action);
    const scamReason = hasCyrillicToken ? "cyrillic_token" : hasCyrillicAction ? "cyrillic_action" : isZeroValueSpam ? "zero_value" : null;
    const isScam = !!scamReason;
    const gasPaidByMe = (raw.from || "").toLowerCase() === walletLower;

    formattedTransactions.push({
      id: raw.hash || `tx-${txIndex}`,
      time,
      action,
      flow,
      counterparty,
      gas_usd: roundUsd(gasUsd),
      value_native: values.valueNative,
      value_usd: values.valueUsd,
      native_symbol: values.nativeSymbol,
      token_amount: values.tokenAmount,
      token_symbol: values.tokenSymbol,
      token_value_usd: values.tokenValueUsd,
      is_scam: isScam,
      scam_reason: scamReason,
      gas_paid_by_me: gasPaidByMe,
    });

    if (!isScam) {
      if (gasPaidByMe) {
        totalGasSpentUsd += gasUsd;
      }

      if (flow === "in") {
        totalReceivedUsd += (values.valueUsd || 0);
      } else if (flow === "out") {
        totalSentUsd += (values.valueUsd || 0);
      }
      
      const addr = (raw.to || "unknown").toLowerCase();
      addressCount.set(addr, (addressCount.get(addr) ?? 0) + 1);
      actionCount.set(action, (actionCount.get(action) ?? 0) + 1);
    }
  }

  const statisticalSummary = buildStatisticalSummary(
    rawTxArray,
    formattedTransactions,
    addressCount,
    actionCount,
    chain
  );
  const gasEfficiency = buildGasEfficiency(formattedTransactions);
  const interactionBreakdown = buildInteractionBreakdown(actionCount);

  return {
    formattedTransactions,
    statisticalSummary,
    gasEfficiency,
    interaction_breakdown: interactionBreakdown,
    wallet_summary: {
      total_received_usd: roundUsd(totalReceivedUsd),
      total_sent_usd: roundUsd(totalSentUsd),
      total_gas_spent_usd: roundUsd(totalGasSpentUsd),
    }
  };
}

/** Agrupa acciones en tipos de cuenta/destino para mostrar con quién interactuaste. */
function buildInteractionBreakdown(actionCount) {
  const result = { DEX: 0, Bridge: 0, Transfer: 0, Approve: 0, Contract: 0 };

  for (const [action, count] of actionCount) {
    const a = String(action).toLowerCase();
    if (a.includes("dex") || a.includes("router")) {
      result.DEX += count;
    } else if (a.includes("bridge")) {
      result.Bridge += count;
    } else if (a.includes("approve")) {
      result.Approve += count;
    } else if (a.includes("transfer") || a.includes("avax") || a.includes("eth")) {
      result.Transfer += count;
    } else {
      result.Contract += count;
    }
  }

  const labels = { DEX: "DEX / Swaps", Bridge: "Bridges", Transfer: "Wallets / Transferencias", Approve: "Aprobaciones", Contract: "Contratos" };
  return Object.entries(result)
    .filter(([, c]) => c > 0)
    .map(([type, count]) => ({ type, label: labels[type], count }));
}

function formatCounterparty(raw) {
  const addr = raw.to || "0x0";
  const name = raw.toName || raw.toSymbol;
  const shortAddr = `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  return name ? `${shortAddr} (${name})` : shortAddr;
}

function calculateGasUsd(raw, avaxUsdPrice) {
  const gasUsed = raw.gasUsed ?? 0n;
  let gasPrice = raw.gasPrice ?? 0n;
  if (gasPrice === 0n && raw.effectiveGasPrice) {
    gasPrice = raw.effectiveGasPrice;
  }

  let costWei = gasUsed * gasPrice;
  /** Fee total reportado por el indexador (si gasUsed*gasPrice no está). */
  if (costWei === 0n && raw.transactionFeeWei && raw.transactionFeeWei > 0n) {
    costWei = raw.transactionFeeWei;
  }

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
    valueUsd: roundUsd(valueUsd),
  };
}

/**
 * Glacier incluye ERC-20 en `erc20Transfers`; el valor nativo suele ser 0 en “contract calls” USDC.
 */
function mergeNativeAndErc20Display(raw, nativeUsdPrice, nativeSymbol) {
  const n = calculateValue(raw, nativeUsdPrice);
  const e = raw.primaryErc20;
  if (!e || !(e.amountHuman > 0)) {
    return {
      valueNative: n.valueNative,
      valueUsd: n.valueUsd,
      nativeSymbol,
      tokenAmount: undefined,
      tokenSymbol: undefined,
      tokenValueUsd: undefined,
    };
  }
  return {
    valueNative: n.valueNative,
    /** USD total fila: nativo + token si hay precio en Glacier */
    valueUsd: roundUsd(n.valueUsd + (e.valueUsd ?? 0)),
    nativeSymbol,
    tokenAmount: e.amountHuman,
    tokenSymbol: e.symbol,
    tokenValueUsd:
      e.valueUsd != null ? roundUsd(e.valueUsd) : undefined,
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

  const chainLabel =
    chain === "ethereum"
      ? "Ethereum"
      : chain === "fuji"
        ? "Avalanche Fuji (testnet)"
        : "Avalanche C-Chain (mainnet)";
  return `Resumen de las últimas ${totalTx} transacciones de una billetera en ${chainLabel}. Total gas gastado: $${totalGasUsd.toFixed(2)} USD. Volumen estimado (AVAX/ETH nativo + ERC-20 con precio del indexador): $${totalValueUsd.toFixed(2)} USD. Gas promedio por tx: $${avgGasUsd} USD. Direcciones más frecuentes: ${topAddresses || "N/A"}. Desglose de acciones: ${actionBreakdown || "N/A"}.`;
}

/**
 * Agrupa gas por hora (UTC) usando datos reales de las txs.
 * Solo datos on-chain: sin estimados ni promedios inventados.
 */
/**
 * Gas por transacción a lo largo del tiempo (orden cronológico).
 * Si hay muchas txs, agrupa por día para legibilidad.
 */
function buildGasEfficiency(formattedTransactions) {
  const txsWithGas = formattedTransactions
    .filter((tx) => !tx.is_scam && tx.gas_paid_by_me && (tx.gas_usd ?? 0) >= 0)
    .map((tx) => {
      const d = new Date(tx.time);
      return {
        time: tx.time,
        timestamp: d.getTime(),
        gas_usd: roundUsd(tx.gas_usd ?? 0),
        action: tx.action,
        label: d.toLocaleDateString("es-CL", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
    })
    .sort((a, b) => a.timestamp - b.timestamp);

  if (txsWithGas.length === 0) {
    return [{ label: "Sin datos", time: "", gas_usd: 0, tx_count: 0 }];
  }

  const maxPoints = 50;
  if (txsWithGas.length <= maxPoints) {
    return txsWithGas.map((t) => ({
      label: t.label,
      time: t.time,
      gas_usd: t.gas_usd,
      tx_count: 1,
      action: t.action,
    }));
  }

  const byDay = new Map();
  for (const t of txsWithGas) {
    const dayKey = t.time.slice(0, 10);
    const cur = byDay.get(dayKey) ?? { totalGas: 0, count: 0, time: t.time };
    cur.totalGas += t.gas_usd;
    cur.count += 1;
    byDay.set(dayKey, cur);
  }
  return Array.from(byDay.entries()).map(([day, v]) => ({
    label: new Date(day + "Z").toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
    }),
    time: v.time,
    gas_usd: roundUsd(v.totalGas),
    tx_count: v.count,
  }));
}
