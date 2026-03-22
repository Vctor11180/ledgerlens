/**
 * Servicio GenLayer: llama al Intelligent Contract desplegado para análisis IA.
 * Usa genlayer-js para writeContract (analyze_wallet) + readContract (get_last_verdict).
 */

import { createClient, createAccount } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";

/**
 * Obtiene el veredicto de identidad usando el contrato GenLayer desplegado.
 * @param {string} statisticalSummary - Resumen del agregador
 * @returns {Promise<{ identity: string, risk_score: number, narrative: string }>}
 */
export async function analyzeWithGenLayer(statisticalSummary) {
  const contractAddress = process.env.GENLAYER_CONTRACT_ADDRESS;
  const privateKey = process.env.GENLAYER_PRIVATE_KEY;

  if (!contractAddress || !privateKey) {
    throw new Error(
      "GENLAYER_CONTRACT_ADDRESS y GENLAYER_PRIVATE_KEY deben estar configurados."
    );
  }

  const account = createAccount(privateKey);
  const client = createClient({
    chain: studionet,
    account,
  });

  await client.initializeConsensusSmartContract();

  const txHash = await client.writeContract({
    address: contractAddress,
    functionName: "analyze_wallet",
    args: [statisticalSummary],
    value: 0n,
  });

  const receipt = await client.waitForTransactionReceipt({
    hash: txHash,
    status: TransactionStatus.ACCEPTED,
    retries: 60,
    interval: 5000,
  });

  if (!receipt?.data?.status || receipt.data.status !== "accepted") {
    throw new Error(
      `GenLayer tx no aceptada: ${receipt?.data?.status || "unknown"}`
    );
  }

  const result = await client.readContract({
    address: contractAddress,
    functionName: "get_last_verdict",
    args: [],
  });

  return normalizeVerdict(result);
}

function normalizeVerdict(raw) {
  if (!raw || typeof raw !== "object") {
    throw new Error("GenLayer devolvió veredicto inválido.");
  }
  const identity = String(raw.identity ?? "").trim() || "Unknown";
  const risk_score = Math.min(
    100,
    Math.max(0, Math.round(Number(raw.risk_score ?? 0)))
  );
  const narrative = String(raw.narrative ?? "").trim() || "Sin narrativa.";
  return { identity, risk_score, narrative };
}
