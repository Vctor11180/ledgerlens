#!/usr/bin/env node
/**
 * Muestra la dirección de la wallet configurada en GENLAYER_PRIVATE_KEY.
 * Útil para verificar que usas la wallet correcta (ej. la que tiene 10 GEN).
 */
import "dotenv/config";
import { createAccount } from "genlayer-js";

const pk = process.env.GENLAYER_PRIVATE_KEY;
if (!pk) {
  console.error("GENLAYER_PRIVATE_KEY no definida en .env");
  process.exit(1);
}
const account = createAccount(pk);
console.log("Wallet en GENLAYER_PRIVATE_KEY:", account.address);
console.log("¿Coincide con tu MetaMask con 10 GEN? (0x50328824e36688ed11C432BB02d4D26Faa226e2c)");
