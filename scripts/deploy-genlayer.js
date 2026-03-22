#!/usr/bin/env node
/**
 * Despliega el contrato WalletAnalyzer en GenLayer StudioNet (sin tokens).
 * Si prefieres Bradbury: cambia studionet por testnetBradbury (requiere GEN del faucet).
 * Uso: GENLAYER_PRIVATE_KEY=0x... node scripts/deploy-genlayer.js
 */

import "dotenv/config";
import { createClient, createAccount } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { TransactionStatus } from "genlayer-js/types";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  const privateKey = process.env.GENLAYER_PRIVATE_KEY;
  if (!privateKey) {
    console.error("GENLAYER_PRIVATE_KEY requerida.");
    process.exit(1);
  }

  const account = createAccount(privateKey);
  const client = createClient({
    chain: studionet,
    account,
  });

  console.log("Inicializando consenso...");
  await client.initializeConsensusSmartContract();

  const contractPath = join(__dirname, "..", "contracts", "wallet_analyzer.py");
  const code = readFileSync(contractPath, "utf-8");

  console.log("Desplegando contrato...");
  const hash = await client.deployContract({
    code,
    args: [],
    leaderOnly: false,
  });

  console.log("Tx hash:", hash);
  console.log("Esperando confirmación (puede tardar 1-2 min)...");

  const receipt = await client.waitForTransactionReceipt({
    hash,
    status: TransactionStatus.ACCEPTED,
    retries: 60,
    interval: 5000,
  });

  // Bradbury: addr en txDataDecoded; otros: en data.contract_address
  const addr =
    receipt?.txDataDecoded?.contractAddress ??
    receipt?.data?.contract_address;
  if (addr) {
    console.log("\n✅ Contrato desplegado:");
    console.log("GENLAYER_CONTRACT_ADDRESS=" + addr);
  } else {
    console.error("No se obtuvo la dirección del contrato.");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
