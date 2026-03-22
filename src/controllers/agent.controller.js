import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { avalancheFuji } from "viem/chains";
import { x402Client } from "@x402/core/client";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import { wrapFetchWithPayment } from "@x402/fetch";
import "dotenv/config";

export async function runAgentController(req, res) {
  const logs = [];
  function log(msg) {
    logs.push(msg);
    console.log("[AGENT]", msg);
  }

  log("🤖 Iniciando Agente de IA Autónomo...");
  const pk = process.env.AGENT_PRIVATE_KEY?.trim() || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  const account = privateKeyToAccount(pk);
  const walletClient = createWalletClient({
    account,
    chain: avalancheFuji,
    transport: http()
  });

  log(`💼 Agente configurado con billetera en Fuji: ${account.address}`);

  const client = new x402Client();
  client.register("eip155:*", new ExactEvmScheme(walletClient));
  const autonomousFetch = wrapFetchWithPayment(fetch, client);

  log("🧠 Pensando qué dirección pública de Avalanche auditar...");
  
  const hfToken = process.env.HUGGINGFACE_API_KEY || process.env.HF_API_TOKEN;
  let targetWallet = req.query.address || "0x8dc08e5055e49b6F9d96aDC4AC277fDe44028367";

  if (req.query.address) {
    log(`🎯 Recibida orden humana. El Agente auditará la billetera: ${targetWallet}`);
  } else if (hfToken) {
    log("📡 Consultando Hugging Face LLM para tomar decisión autónoma...");
    try {
      const prompt = "Eres un agente autónomo de análisis web3. Escoge una dirección importante en Avalanche C-Chain o Ethereum. Proporciona solo un JSON de este formato: {\"target_address\": \"0x...\"}";
      const completionRes = await fetch("https://router.huggingface.co/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${hfToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: process.env.HF_MODEL || "meta-llama/Llama-3.3-70B-Instruct",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          max_tokens: 100,
        }),
      });
      const obj = await completionRes.json();
      const txt = obj.choices?.[0]?.message?.content?.trim() || "";
      const dec = JSON.parse(txt.replace(/```json/g, "").replace(/```/g, ""));
      if (dec.target_address) targetWallet = dec.target_address;
    } catch(e) {
      log(`⚠️ Error en IA, usando fallback: ${e.message}`);
    }
  } else {
    log("⚠️ No se configuró HUGGINGFACE_API_KEY, usando dirección aleatoria por defecto.");
  }

  log(`🚀 Llamando a la API protegida (La librería x402 negociará y pagará si pide USDC)...`);

  let report = null;
  let paymentHash = null;

  try {
    const port = process.env.PORT || 3001;
    // Llama al propio backend
    const apiUrl = `http://localhost:${port}/api/analyze/${targetWallet}`;
    const response = await autonomousFetch(apiUrl);
    
    if (!response.ok) {
      log(`❌ API Error HTTP ${response.status}`);
      const errText = await response.text();
      log(errText);
      return res.status(500).json({ logs, error: `API HTTP ${response.status}`, targetWallet });
    }

    report = await response.json();
    log("✅ Datos adquiridos on-chain desde la API de LedgerLens.");
    
    const pmtHeader = response.headers.get("X-PAYMENT-RESPONSE");
    if (pmtHeader) {
      log(`💳 Firmado y pagado. Token/Tx EIP-3009: ${pmtHeader}`);
      paymentHash = pmtHeader;
    }

  } catch (err) {
    log(`❌ Fallo delegando el pago x402: ${err.message}`);
    if (err.paymentRequired) {
      log("💡 INFO: Para que el Agente pague, necesita tener USDC real en testnet en su clave: " + account.address);
    }
  }

  res.json({ logs, targetWallet, report, paymentHash });
}
