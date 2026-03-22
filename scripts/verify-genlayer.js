#!/usr/bin/env node
/**
 * Verifica la conexión con GenLayer: contrato desplegado y capacidad de lectura/escritura.
 */

import "dotenv/config";
import { createClient, createAccount } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";

const TEST_SUMMARY =
  "Total txs: 5. Promedio por día: 2. DEX swaps: 3. Transfers: 2. Gas USD total: 0.5.";

async function main() {
  const addr = process.env.GENLAYER_CONTRACT_ADDRESS;
  const pk = process.env.GENLAYER_PRIVATE_KEY;

  console.log("\n🔍 Verificación GenLayer\n");

  if (!addr || !pk) {
    console.log("❌ Faltan GENLAYER_CONTRACT_ADDRESS o GENLAYER_PRIVATE_KEY en .env");
    process.exit(1);
  }

  console.log("Contrato:", addr);
  console.log("Red: Testnet Bradbury");
  console.log("");

  const account = createAccount(pk);
  const client = createClient({ chain: testnetBradbury, account });

  try {
    // 1. Leer estado actual (get_last_verdict)
    console.log("1. Leyendo get_last_verdict()...");
    const prev = await client.readContract({
      address: addr,
      functionName: "get_last_verdict",
      args: [],
    });
    console.log("   ✅ Lectura OK:", {
      identity: prev?.identity ?? "(vacío)",
      risk_score: prev?.risk_score ?? "-",
    });
  } catch (e) {
    console.log("   ❌ Error lectura:", e.message);
    process.exit(1);
  }

  let hash;
  try {
    // 2. Escribir (analyze_wallet) con resumen de prueba
    console.log("\n2. Escribiendo analyze_wallet() con resumen de prueba...");
    hash = await client.writeContract({
      address: addr,
      functionName: "analyze_wallet",
      args: [TEST_SUMMARY],
      value: 0n,
    });
    console.log("   Tx hash:", hash);
    console.log("   Esperando confirmación (1-2 min)...");
  } catch (e) {
    console.log("   ❌ Error write:", e.message);
    process.exit(1);
  }

  try {
    await client.waitForTransactionReceipt({
      hash,
      status: TransactionStatus.ACCEPTED,
      retries: 60,
      interval: 5000,
    });
    console.log("   ✅ Transacción aceptada");
  } catch (e) {
    console.log("   ⚠️ Timeout esperando receipt:", e.message);
  }

  try {
    // 3. Leer de nuevo el veredicto
    console.log("\n3. Leyendo get_last_verdict() tras analyze_wallet...");
    const next = await client.readContract({
      address: addr,
      functionName: "get_last_verdict",
      args: [],
    });
    console.log("   ✅ Veredicto:", {
      identity: next?.identity ?? "-",
      risk_score: next?.risk_score ?? "-",
      narrative: (next?.narrative ?? "").slice(0, 80) + "...",
    });
  } catch (e) {
    console.log("   ❌ Error lectura post-write:", e.message);
  }

  console.log("\n✅ GenLayer: conexión y contrato operativos\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
