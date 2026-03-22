import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { avalancheFuji } from "viem/chains";
import { x402Client } from "@x402/core/client";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import { wrapFetchWithPayment } from "@x402/fetch";
import "dotenv/config";

/**
 * ERC-8004 Autonomous AI Agent
 * Un agente IA que usa HTTP x402 para pagar por una llamada de API (servicios del mundo real),
 * tomando decisiones sin intervención humana usando presupuestos locales de su propia billetera.
 */

async function main() {
  console.log("🤖 Iniciando Agente de IA Autónomo (ERC-8004 / x402 Payment Protocol)\n");

  // 1. Configurar Billetera Autónoma del Agente (Fondeada con USDC y AVAX)
  const pk = process.env.AGENT_PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  const account = privateKeyToAccount(pk);
  const walletClient = createWalletClient({
    account,
    chain: avalancheFuji,
    transport: http()
  });

  console.log(`💼 Agente operando con billetera: ${account.address}`);

  // 2. Registrar cliente HTTP x402 apoyado en la billetera
  const client = new x402Client();
  client.register("eip155:*", new ExactEvmScheme(walletClient));

  // Envolvemos 'fetch' estándar del sistema para que lance firmas EIP-3009 
  // cuando el servidor (LedgerLens backend) devuelva un "402 Payment Required"
  const autonomousFetch = wrapFetchWithPayment(fetch, client);

  // 3. Dejamos que el Agente "Piense" a quién investigar hoy
  console.log("🧠 El agente IA está decidiendo qué acción autónoma realizar...\n");
  
  const hfToken = process.env.HUGGINGFACE_API_KEY;
  if (!hfToken) throw new Error("Falta HUGGINGFACE_API_KEY en .env");

  const prompt = "Eres un agente auditor de finanzas descentralizadas. Tu tarea hoy es escoger UNA dirección de billetera pública (0x...) conocida en Avalanche o Ethereum para auditar. Proporciona única y exclusivamente un objeto JSON con la propiedad 'target_address' y nada más.";
  
  const completionRes = await fetch("https://router.huggingface.co/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${hfToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.HF_MODEL || "meta-llama/Llama-3.3-70B-Instruct",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 100,
    }),
  });

  const completionObj = await completionRes.json();
  const responseText = completionObj.choices?.[0]?.message?.content?.trim() || '{"target_address": "0x8dc08e5055e49b6F9d96aDC4AC277fDe44028367"}';
  let targetWallet = "0x8dc08e5055e49b6F9d96aDC4AC277fDe44028367"; // Fallback por si la IA falla el JSON
  try {
     const decision = JSON.parse(responseText.replace(/```json/g, "").replace(/```/g, ""));
     targetWallet = decision.target_address || targetWallet;
  } catch(e) {}
  
  console.log(`\n🎯 Objetivo elegido por la IA: ${targetWallet}`);

  // 4. El Agente consume el servicio pago (x402 Backend de LedgerLens) y firma on-chain la autorización de USDC
  console.log("🔥 Haciendo petición HTTP protegida (El SDK x402 pagará el costo automáticamente si recibe un Error HTTP 402)...");
  
  const apiUrl = `http://localhost:3001/api/analyze/${targetWallet}`;
  try {
    const response = await autonomousFetch(apiUrl);

    if (!response.ok) {
      console.error(`❌ La API devolvió un error: ${response.status} ${response.statusText}`);
      const errBody = await response.text();
      console.error(errBody);
      return;
    }

    const report = await response.json();
    console.log(`✅ ¡Servicio real adquirido exitosamente on-chain sin humanos!\n`);
    console.log(`📊 INFORME IA OBTENIDO DE LA API PAGA:
Identidad: ${report.identity}
Riesgo: ${report.risk_score}/100
Narrativa: ${report.narrative}
    `);

    // Mostrar el Hash de Transacción x402 si está disponible
    const pmtHeader = response.headers.get("X-PAYMENT-RESPONSE");
    if (pmtHeader) {
         console.log(`💳 Hash del pago (EIP-3009) en red: ${pmtHeader}`);
    }

  } catch (error) {
    console.error("❌ Falló la ejecución autónoma del Agente:", error.message);
    if (error.message.includes("saldo") || error.message.includes("insuficiente") || !!error.paymentRequired) {
      console.log("\n💡 NOTA: El Agente está configurado correctamente para ERC-8004. Sin embargo, su billetera no tiene USDC suficiente en Avalanche Fuji para pagar o la API HTTP no está levantada.");
    }
  }
}

main().catch(console.error);
