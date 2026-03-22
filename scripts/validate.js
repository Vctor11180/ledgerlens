#!/usr/bin/env node
/**
 * Valida el desarrollo actual: health, analyze API, esquema de respuesta.
 * Uso: npm start (en otra terminal) y luego node scripts/validate.js
 * O: node scripts/validate.js (prueba contra baseURL)
 */

const BASE_URL = process.env.VALIDATE_URL || "http://localhost:3001";
const TEST_ADDRESS = "0x8dc08e5055e49b6F9d96aDC4AC277fDe44028367"; // Dirección verificada en VALIDATION.md
const CHAINS = ["avalanche", "ethereum"];
const REQUIRED_CHAINS = ["avalanche"]; // Ethereum puede no estar en todos los planes Glacier

const requiredFields = [
  "identity",
  "risk_score",
  "narrative",
  "chain",
  "transactions",
  "gas_efficiency",
];

async function httpGet(url) {
  const u = new URL(url);
  const http = u.protocol === "https:" ? await import("node:https") : await import("node:http");
  const mod = http.default;
  return new Promise((resolve, reject) => {
    const req = mod.get(url, (r) => {
      let body = "";
      r.on("data", (c) => (body += c));
      r.on("end", () =>
        resolve({
          status: r.statusCode,
          ok: r.statusCode >= 200 && r.statusCode < 300,
          json: () => Promise.resolve(JSON.parse(body || "{}")),
        })
      );
    });
    req.on("error", reject);
  });
}

async function run() {
  console.log("\n🔍 LedgerLens — Validación del desarrollo\n");
  console.log("Base URL:", BASE_URL);
  console.log("");

  let passed = 0;
  let failed = 0;

  // 1. Health
  try {
    const res = await httpGet(`${BASE_URL}/health`);
    const data = await res.json();
    if (res.ok && data.status === "ok") {
      console.log("✅ /health — OK");
      passed++;
    } else {
      console.log("❌ /health — Falló:", data);
      failed++;
    }
  } catch (e) {
    console.log("❌ /health — Error:", e.message);
    console.log("   ¿Está corriendo el servidor? (npm run dev)");
    failed++;
  }

  // 2. Analyze (por chain)
  for (const chain of CHAINS) {
    const isRequired = REQUIRED_CHAINS.includes(chain);
    try {
      const url = `${BASE_URL}/api/analyze/${TEST_ADDRESS}?chain=${chain}`;
      const res = await httpGet(url);
      const data = await res.json();

      if (!res.ok) {
        const msg = data.error || data.message || JSON.stringify(data);
        if (isRequired) {
          console.log(`❌ /api/analyze (chain=${chain}) — ${res.status}:`, msg);
          failed++;
        } else {
          console.log(`⚠️ /api/analyze (chain=${chain}) — ${res.status} (opcional):`, msg);
        }
        continue;
      }

      const missing = requiredFields.filter((f) => !(f in data));
      if (missing.length > 0) {
        console.log(`❌ /api/analyze (chain=${chain}) — Faltan campos:`, missing.join(", "));
        if (isRequired) failed++;
        continue;
      }

      const validIdentity =
        typeof data.identity === "string" && data.identity.length > 0;
      const validRisk =
        typeof data.risk_score === "number" && data.risk_score >= 0 && data.risk_score <= 100;
      const validTx = Array.isArray(data.transactions);
      const validGas = Array.isArray(data.gas_efficiency);

      if (!validIdentity || !validRisk || !validTx || !validGas) {
        console.log(`❌ /api/analyze (chain=${chain}) — Esquema inválido`);
        if (!validIdentity) console.log("   - identity esperado");
        if (!validRisk) console.log("   - risk_score 0-100");
        if (!validTx) console.log("   - transactions[]");
        if (!validGas) console.log("   - gas_efficiency[]");
        if (isRequired) failed++;
        continue;
      }

      console.log(
        `✅ /api/analyze (chain=${chain}) — OK | identity=${data.identity} | risk=${data.risk_score} | txs=${data.transactions.length}`
      );
      passed++;
    } catch (e) {
      console.log(`❌ /api/analyze (chain=${chain}) — Error:`, e.message);
      if (isRequired) failed++;
    }
  }

  // 3. Validación de dirección inválida
  try {
    const res = await httpGet(`${BASE_URL}/api/analyze/invalid_address`);
    const data = await res.json();
    if (res.status === 400 && (data.error || data.message)) {
      console.log("✅ Validación de dirección inválida — OK (400)");
      passed++;
    } else {
      console.log("❌ Validación de dirección — Esperado 400, recibido:", res.status);
      failed++;
    }
  } catch (e) {
    console.log("❌ Validación de dirección — Error:", e.message);
    failed++;
  }

  console.log("\n---");
  console.log(`Resultado: ${passed} pasaron, ${failed} fallaron\n`);
  process.exit(failed > 0 ? 1 : 0);
}

run();
