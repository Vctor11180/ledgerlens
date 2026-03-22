/**
 * Servicio de extracción de transacciones desde Avalanche Glacier API (L1/C-Chain)
 * Documentación: https://developers.avacloud.io/data-api/address-transactions
 */

const SUPPORTED_CHAINS = {
  avalanche: {
    chainId: "43114",
    label: "Avalanche C-Chain",
  },
  /** Testnet: misma dirección EVM que en mainnet, actividad distinta en cadena. */
  fuji: {
    chainId: "43113",
    label: "Avalanche Fuji",
  },
  ethereum: {
    chainId: "1",
    label: "Ethereum Mainnet",
  },
};
const GLACIER_BASE_URL = "https://glacier-api.avax.network";
const DEFAULT_PAGE_SIZE = 50;

/**
 * Obtiene las últimas transacciones de una dirección en una chain EVM soportada
 * @param {string} address - Dirección de la billetera (0x...)
 * @param {"avalanche"|"ethereum"} chain - Red a consultar en Glacier
 * @returns {Promise<Array>} Array de transacciones crudas
 */
export async function fetchTransactions(address, chain = "avalanche") {
  const apiKey = process.env.GLACIER_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GLACIER_API_KEY no configurada. Obtén una key en https://app.avacloud.io/"
    );
  }

  const normalizedAddress = address.trim().toLowerCase();
  if (!normalizedAddress.startsWith("0x") || normalizedAddress.length !== 42) {
    throw new Error("Dirección inválida. Debe ser una dirección EVM (0x + 40 hex).");
  }

  const network = SUPPORTED_CHAINS[chain];
  if (!network) {
    throw new Error(
      `Chain no soportada: ${chain}. Usa una de: ${Object.keys(SUPPORTED_CHAINS).join(", ")}`
    );
  }

  const url = `${GLACIER_BASE_URL}/v1/chains/${network.chainId}/addresses/${normalizedAddress}/transactions?pageSize=${DEFAULT_PAGE_SIZE}&sortOrder=desc`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "x-glacier-api-key": apiKey,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Glacier API error (${response.status}): ${text || response.statusText}`
    );
  }

  const data = await response.json();
  const rawTransactions = data.transactions ?? [];

  return rawTransactions.map((tx) => extractUsefulData(tx, normalizedAddress));
}

export function getSupportedChains() {
  return Object.keys(SUPPORTED_CHAINS);
}

/**
 * Obtiene el balance nativo via RPC.
 */
export async function fetchNativeBalance(address, chain = "avalanche") {
  const rpcUrls = {
    avalanche: "https://api.avax.network/ext/bc/C/rpc",
    fuji: "https://api.avax-test.network/ext/bc/C/rpc",
    ethereum: "https://cloudflare-eth.com"
  };
  const url = rpcUrls[chain] || rpcUrls.avalanche;
  
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_getBalance",
        params: [address, "latest"]
      })
    });
    const data = await res.json();
    return BigInt(data.result || "0x0");
  } catch (e) {
    console.error("fetchNativeBalance error:", e);
    return 0n;
  }
}

/** Parsea valor a BigInt (Glacier puede enviar string, number o hex). */
function parseBigInt(val) {
  if (val == null || val === "") return 0n;
  try {
    return BigInt(val);
  } catch {
    return 0n;
  }
}

/**
 * Resume ERC-20 más relevante para la wallet (como en Core: “9 USDC”, etc.).
 */
function summarizeErc20ForWallet(erc20Transfers, walletLower) {
  if (!Array.isArray(erc20Transfers) || erc20Transfers.length === 0) return null;
  const w = walletLower.toLowerCase();

  const rows = erc20Transfers.map((t) => {
    const from = String(t.from?.address ?? t.from ?? "").toLowerCase();
    const to = String(t.to?.address ?? t.to ?? "").toLowerCase();
    const tok = t.erc20Token ?? {};
    const decimals = Number(tok.decimals ?? 18);
    const rawVal = parseBigInt(t.value);
    const amountHuman =
      decimals > 0 ? Number(rawVal) / 10 ** Math.min(decimals, 36) : 0;
    const unitPrice = tok.price?.value != null ? Number(tok.price.value) : null;
    const valueUsd =
      unitPrice != null && Number.isFinite(amountHuman)
        ? amountHuman * unitPrice
        : null;
    return { from, to, amountHuman, symbol: tok.symbol || "?", valueUsd };
  });

  const involving = rows.filter((r) => r.from === w || r.to === w);
  const pool = involving.length ? involving : rows;
  if (pool.length === 0) return null;

  pool.sort(
    (a, b) =>
      Math.abs(b.valueUsd ?? b.amountHuman ?? 0) -
      Math.abs(a.valueUsd ?? a.amountHuman ?? 0)
  );
  const best = pool[0];
  let direction = "neutral";
  if (best.from === w) direction = "out";
  else if (best.to === w) direction = "in";

  return {
    amountHuman: Math.round(best.amountHuman * 1e6) / 1e6,
    symbol: best.symbol,
    valueUsd:
      best.valueUsd != null ? Math.round(best.valueUsd * 100) / 100 : null,
    direction,
  };
}

/**
 * Extrae información útil de cada ítem de Glacier (native + erc20Transfers).
 */
function extractUsefulData(tx, walletAddressLower) {
  const native = tx.nativeTransaction ?? tx;
  const to = native.to ?? {};
  const fromObj = native.from ?? {};
  const method = native.method ?? {};

  const gasUsed = parseBigInt(native.gasUsed);
  const gasPrice = parseBigInt(native.gasPrice);
  const effectiveGasPrice = parseBigInt(native.effectiveGasPrice);
  const transactionFeeWei = parseBigInt(
    native.transactionFee ?? native.fee ?? native.txFee
  );

  const primaryErc20 = summarizeErc20ForWallet(
    tx.erc20Transfers,
    walletAddressLower
  );

  return {
    hash: native.txHash ?? native.hash ?? null,
    timestamp: native.blockTimestamp
      ? Number(native.blockTimestamp)
      : native.timestamp
        ? Number(native.timestamp)
        : null,
    from: (typeof fromObj === "object" ? fromObj.address : fromObj) ?? null,
    to: (typeof to === "object" ? to.address : to) ?? null,
    toName: typeof to === "object" ? to.name : null,
    toSymbol: typeof to === "object" ? to.symbol : null,
    value: parseBigInt(native.value),
    gasUsed,
    gasPrice,
    effectiveGasPrice,
    transactionFeeWei,
    gasLimit: parseBigInt(native.gasLimit),
    callType: method.callType ?? "UNKNOWN",
    methodHash: method.methodHash ?? "",
    methodName: method.methodName ?? "",
    primaryErc20,
  };
}
