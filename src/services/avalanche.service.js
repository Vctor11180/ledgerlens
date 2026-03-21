/**
 * Servicio de extracción de transacciones desde Avalanche Glacier API (L1/C-Chain)
 * Documentación: https://developers.avacloud.io/data-api/address-transactions
 */

const SUPPORTED_CHAINS = {
  avalanche: {
    chainId: "43114",
    label: "Avalanche C-Chain",
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

  return rawTransactions.map(extractUsefulData);
}

export function getSupportedChains() {
  return Object.keys(SUPPORTED_CHAINS);
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
 * Extrae solo la información útil de cada transacción cruda (Glacier API).
 * Soporta datos en nativeTransaction o en la raíz del objeto.
 */
function extractUsefulData(tx) {
  const native = tx.nativeTransaction ?? tx;
  const to = native.to ?? {};

  return {
    hash: native.txHash ?? native.hash ?? null,
    timestamp: native.blockTimestamp
      ? Number(native.blockTimestamp)
      : native.timestamp
        ? Number(native.timestamp)
        : null,
    to: (typeof to === "object" ? to.address : to) ?? null,
    toName: typeof to === "object" ? to.name : null,
    toSymbol: typeof to === "object" ? to.symbol : null,
    value: parseBigInt(native.value),
    gasUsed: parseBigInt(native.gasUsed),
    gasPrice: parseBigInt(native.gasPrice),
    gasLimit: parseBigInt(native.gasLimit),
    callType: (native.method ?? {}).callType ?? "UNKNOWN",
    methodHash: (native.method ?? {}).methodHash ?? "",
    methodName: (native.method ?? {}).methodName ?? "",
  };
}
