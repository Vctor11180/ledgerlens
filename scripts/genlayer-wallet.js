#!/usr/bin/env node
/**
 * Genera una nueva wallet para GenLayer Testnet Bradbury.
 * Usa la dirección en el faucet, obtén 100 GEN, luego despliega con deploy-genlayer.js
 */

import { generatePrivateKey, createAccount } from "genlayer-js";

const privateKey = generatePrivateKey();
const account = createAccount(privateKey);

console.log("\n🔑 Nueva wallet GenLayer creada:\n");
console.log("Address:", account.address);
console.log("Private Key:", privateKey);
console.log("\n📋 Pasos siguientes:");
console.log("1. Copia la address y ve a https://testnet-faucet.genlayer.foundation/");
console.log("2. Pega la address y haz clic en 'Claim 100 GEN' (una vez cada 24h)");
console.log("3. Añade a tu .env:");
console.log("   GENLAYER_PRIVATE_KEY=" + privateKey);
console.log("4. Ejecuta: npm run deploy:genlayer");
console.log("5. Copia la dirección del contrato que se imprime y añade a .env:");
console.log("   GENLAYER_CONTRACT_ADDRESS=0x...\n");
