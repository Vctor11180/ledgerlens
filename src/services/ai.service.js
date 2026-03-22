/**
 * Servicio de IA: analiza el comportamiento de la billetera y clasifica (Humano vs Bot)
 * Prioridad: GenLayer (si configurado) → Hugging Face (gratis para pruebas) → OpenAI.
 */

import OpenAI from "openai";

const SYSTEM_PROMPT = `Eres un auditor experto de blockchain. Analiza el siguiente resumen estadístico de transacciones recientes de una billetera (la cantidad exacta viene en el texto; no asumas siempre 50). El desglose de "acciones" son etiquetas derivadas del indexador (p. ej. transfer nativo/ERC-20, "Contract call", "DEX router call", nombres de método): no son juicios de trading; "DEX router call" solo indica un selector típico de router, no que sea necesariamente un intercambio. Si el gas total en USD es 0 o muy bajo, puede deberse a datos incompletos del indexador, no a ausencia real de fees: no etiquetes como bot de alta frecuencia solo por eso; sé prudente y menciona la incertidumbre si los datos son escasos.

Debes clasificar la billetera en una de estas 3 categorías de 'identity': 'Verified Human User', 'High-Frequency Trading Bot', o 'Smart Contract Service'. Asigna un 'risk_score' del 0 al 100 (100 = alto riesgo de bot/MEV) y una 'narrative' de 2 oraciones basada en el resumen. Devuelve ESTRICTAMENTE JSON sin markdown: { "identity": "...", "risk_score": 0, "narrative": "..." }`;

/**
 * Envía el resumen estadístico a la IA y obtiene el veredicto.
 * Usa GenLayer si GENLAYER_CONTRACT_ADDRESS está definido; si no, OpenAI.
 * @param {string} statisticalSummary - Resumen generado por el agregador
 * @returns {Promise<{ identity: string, risk_score: number, narrative: string }>}
 */
/** Modelos en router.huggingface.co (formato nombre:proveedor). Se prueba el de HF_MODEL y luego respaldos. */
const HF_MODEL_FALLBACKS = [
  "meta-llama/Llama-3.3-70B-Instruct:fireworks-ai",
  "meta-llama/Meta-Llama-3-8B-Instruct:fireworks-ai",
];

export async function analyzeWalletBehavior(statisticalSummary) {
  const hfToken = process.env.HUGGINGFACE_API_KEY || process.env.HF_API_TOKEN;
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY?.trim());
  const hasGenLayer =
    Boolean(process.env.GENLAYER_CONTRACT_ADDRESS?.trim()) &&
    Boolean(process.env.GENLAYER_PRIVATE_KEY?.trim());

  /** Para mostrar un error útil si todo falla y no hay OpenAI */
  let previousFailure = null;

  if (!hasGenLayer && !hfToken?.trim() && !hasOpenAI) {
    throw new Error(
      "No hay proveedor IA configurado. En la carpeta del backend, edita el archivo `.env` (junto a package.json) y añade al menos una de:\n\n" +
        "  • HUGGINGFACE_API_KEY=hf_...   → token en https://huggingface.co/settings/tokens\n" +
        "  • OPENAI_API_KEY=sk-...        → opcional como respaldo\n" +
        "  • GenLayer: GENLAYER_CONTRACT_ADDRESS + GENLAYER_PRIVATE_KEY\n\n" +
        "Reinicia el servidor después de guardar (`npm run dev`)."
    );
  }

  if (process.env.GENLAYER_CONTRACT_ADDRESS && process.env.GENLAYER_PRIVATE_KEY) {
    try {
      const { analyzeWithGenLayer } = await import("./genlayer.service.js");
      return await analyzeWithGenLayer(statisticalSummary);
    } catch (err) {
      previousFailure = `GenLayer: ${err.message}`;
      console.warn("[ai] GenLayer falló, usando Hugging Face/OpenAI:", err.message);
    }
  }

  if (hfToken?.trim()) {
    try {
      return await analyzeWithHuggingFace(statisticalSummary, hfToken.trim());
    } catch (err) {
      previousFailure = `Hugging Face: ${err.message}`;
      console.warn("[ai] Hugging Face falló, usando OpenAI:", err.message);
    }
  }

  return analyzeWithOpenAI(statisticalSummary, previousFailure);
}

/**
 * Prueba HF_MODEL (si existe) y luego modelos de respaldo.
 */
async function analyzeWithHuggingFace(statisticalSummary, token) {
  const envModel = process.env.HF_MODEL?.trim();
  const orderedModels = [
    ...(envModel ? [envModel] : []),
    ...HF_MODEL_FALLBACKS.filter((m) => m !== envModel),
  ];
  const uniqueModels = [...new Set(orderedModels)];

  let lastError = null;
  for (const model of uniqueModels) {
    try {
      const parsed = await huggingFaceChatOnce(statisticalSummary, token, model);
      if (uniqueModels.length > 1 && model !== uniqueModels[0]) {
        console.warn(`[ai] Hugging Face OK con modelo de respaldo: ${model}`);
      }
      return parsed;
    } catch (err) {
      lastError = err;
      console.warn(`[ai] HF modelo "${model}":`, err.message);
    }
  }

  throw lastError ?? new Error("Hugging Face: ningún modelo respondió.");
}

async function huggingFaceChatOnce(statisticalSummary, token, model) {
  const response = await fetch("https://router.huggingface.co/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: statisticalSummary },
      ],
      temperature: 0.2,
      max_tokens: 220,
    }),
  });

  const rawText = await response.text();
  let data;
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch {
    data = { raw: rawText };
  }

  if (!response.ok) {
    const detail =
      typeof data === "object" && data !== null
        ? JSON.stringify(data).slice(0, 800)
        : String(rawText).slice(0, 800);
    throw new Error(`HTTP ${response.status} (${model}): ${detail}`);
  }

  const content =
    data?.choices?.[0]?.message?.content ||
    data?.choices?.[0]?.text ||
    extractHfText(data);
  if (!content) {
    throw new Error(`Sin contenido en la respuesta (${model}).`);
  }

  const parsed = parseJsonResponse(content);
  validateVerdict(parsed);
  return parsed;
}

async function analyzeWithOpenAI(statisticalSummary, previousFailure = null) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    const hint =
      "\n\nQué revisar:\n" +
      "  • Token HF con permiso de lectura: https://huggingface.co/settings/tokens\n" +
      "  • Acepta las condiciones del modelo en la página del modelo en Hugging Face (si pide).\n" +
      "  • Prueba a comentar HF_MODEL en `.env` para usar los modelos por defecto del código.\n" +
      "  • O añade OPENAI_API_KEY=sk-... como respaldo.\n";
    const detail = previousFailure ? `\nDetalle: ${previousFailure}` : "";
    throw new Error(
      "Hugging Face (y/o GenLayer) falló y no hay OPENAI_API_KEY en `.env`." +
        detail +
        hint
    );
  }

  const openai = new OpenAI({ apiKey });

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: statisticalSummary },
    ],
    temperature: 0.3,
  });

  const content = completion.choices[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("La IA no devolvió una respuesta válida.");
  }

  const parsed = parseJsonResponse(content);
  validateVerdict(parsed);
  return parsed;
}

function extractHfText(data) {
  if (Array.isArray(data) && typeof data[0]?.generated_text === "string") {
    return data[0].generated_text.trim();
  }
  if (typeof data?.generated_text === "string") {
    return data.generated_text.trim();
  }
  if (Array.isArray(data) && typeof data[0]?.summary_text === "string") {
    return data[0].summary_text.trim();
  }
  return "";
}

function parseJsonResponse(content) {
  let cleaned = content;
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }
  // Algunos modelos incluyen texto antes/después del JSON.
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    throw new Error(`La IA devolvió JSON inválido: ${content.slice(0, 200)}`);
  }
}

function validateVerdict(obj) {
  if (!obj || typeof obj !== "object") {
    throw new Error("El veredicto de la IA no es un objeto válido.");
  }
  if (typeof obj.identity !== "string" || !obj.identity.trim()) {
    throw new Error("El veredicto debe incluir 'identity' (string).");
  }
  const score = Number(obj.risk_score);
  if (Number.isNaN(score) || score < 0 || score > 100) {
    throw new Error("El veredicto debe incluir 'risk_score' entre 0 y 100.");
  }
  if (typeof obj.narrative !== "string" || !obj.narrative.trim()) {
    throw new Error("El veredicto debe incluir 'narrative' (string).");
  }
  obj.risk_score = Math.round(score);
}
