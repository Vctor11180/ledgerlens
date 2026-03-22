# Prisma — Financial Intelligence on Chain

> **Analizador financiero on-chain** para billeteras Avalanche y Ethereum. Extrae transacciones vía Glacier, clasifica **Humano vs Bot** con IA (GenLayer/Hugging Face), detecta posibles estafas (dusting, caracteres cirílicos) y ofrece dashboards de ingresos, gastos, gas y export PDF.

**Aleph Hackathon 2026**

---

## 🔗 Enlaces

| Recurso | URL |
|---------|-----|
| **Repositorio** | [github.com/Kenyi001/ledgerlens](https://github.com/Kenyi001/ledgerlens) |
| **Live Demo (Vercel)** | [ledgerlens-backend.vercel.app](https://ledgerlens-backend.vercel.app) |
| **Documentación** | [HACKATHON.md](./HACKATHON.md) · [X402.md](./X402.md) · [GENLAYER.md](./GENLAYER.md) · [CHECKLIST.md](./CHECKLIST.md) |

---

## Stack tecnológico (dónde se usa cada cosa)

| Capa | Tecnología | Archivo / Uso |
|------|------------|---------------|
| **Frontend** | React 19, Vite 8, TypeScript, Tailwind 4 | `ledgerlens-front/` — SPA, HMR |
| **Estado / Wallet** | wagmi 3, viem 2 | `ledgerlens-front/src/wagmi.ts`, Header, useRunAnalysis |
| **Gráficos** | Recharts | `MoneyFlowChart.tsx`, `GasEfficiencyChart.tsx` |
| **Backend** | Node.js, Express, ES Modules | `src/` — API REST; serverless en Vercel |
| **Datos on-chain** | Avalanche Glacier API | `src/services/avalanche.service.js` — transacciones, balances |
| **IA** | Hugging Face, OpenAI, GenLayer | `src/services/ai.service.js` — clasificación Humano/Bot |
| **Pagos API** | x402, @x402/core, @x402/express, @x402/evm, PayAI | Backend: middleware; Frontend: wrapFetchWithPayment |
| **GenLayer** | genlayer-js | `src/services/genlayer.service.js`, `contracts/wallet_analyzer.py` |
| **Export PDF** | jsPDF, jspdf-autotable | `ledgerlens-front/src/lib/exportReport.ts` |

---

## Dónde está el pago x402 en el frontend

El flujo x402 **sí está implementado** en el frontend. Se aplica cuando:

1. **Backend** tiene `X402_ENABLED=true` → la ruta `/api/analyze/:address` devuelve **402 Payment Required** si no hay pago.
2. **Usuario** tiene wallet conectada (MetaMask, Core, etc.).

### Archivos del frontend involucrados

| Archivo | Líneas / Función |
|---------|------------------|
| `ledgerlens-front/src/lib/api.ts` | 85–113: si hay `walletClient`, usa `wrapFetchWithPayment` y `ExactEvmScheme` para firmar EIP-3009 y pagar USDC al recibir 402 |
| `ledgerlens-front/src/features/analysis/hooks/useRunAnalysis.ts` | 25–36: con wallet conectada, cambia a Fuji/C-Chain (red de cobro) y pasa `walletClient` a `fetchAnalysis` |
| `ledgerlens-front/src/components/layout/DashboardLayout.tsx` | Muestra badge "x402 · Pago USDC" + enlace al hash cuando existe `payment_tx_hash` |
| `ledgerlens-front/src/features/analysis/store/useAnalysisStore.ts` | 37–38: pasa `walletClient` a `fetchAnalysisApi` |

### Flujo resumido

```
Usuario conecta wallet → useRunAnalysis pasa walletClient → fetchAnalysis (api.ts)
  → wrapFetchWithPayment intercepta 402
  → ExactEvmScheme firma EIP-3009 con USDC
  → Reintenta la petición con PAYMENT-SIGNATURE
  → Backend valida → 200 + PAYMENT-RESPONSE (tx hash)
  → Dashboard muestra "x402 · Pago USDC"
```

Si `X402_ENABLED` no está en `true` en el backend, el análisis es gratuito y no se usa pago.

---

## Contratos y datos utilizados

### Contrato GenLayer: `contracts/wallet_analyzer.py`

- **Función principal:** `analyze_wallet(statistical_summary)` — escribe; llama al LLM con consenso.
- **Lectura:** `get_last_verdict()` — devuelve `{ identity, risk_score, narrative }`.
- **Red:** StudioNet (desarrollo) o Testnet Bradbury (producción).
- **Dirección (ejemplo):** `GENLAYER_CONTRACT_ADDRESS` en `.env`.

### Contratos x402 (externos)

- **PayAI Facilitator:** liquidación USDC.
- **USDC:** Avalanche C-Chain (43114) o Fuji (43113), según `X402_NETWORK`.

### Glacier API

- **Fuente:** [AvaCloud](https://app.avacloud.io/) — transacciones, ERC-20, método de llamada.
- **Chains:** Avalanche C-Chain (43114), Fuji (43113), Ethereum (1).

---

## Variables de entorno

| Variable | Obligatoria | Uso |
|----------|-------------|-----|
| `GLACIER_API_KEY` | Sí | [AvaCloud](https://app.avacloud.io/) — transacciones on-chain |
| `HUGGINGFACE_API_KEY` o `OPENAI_API_KEY` | Sí | IA para clasificación |
| `GENLAYER_PRIVATE_KEY` | GenLayer | Deploy y llamadas al contrato |
| `GENLAYER_CONTRACT_ADDRESS` | GenLayer | Dirección del contrato |
| `X402_ENABLED`, `X402_PAY_TO`, `X402_NETWORK` | x402 | Cobro por API en USDC |
| `AVAX_USD_PRICE` | No | Precio AVAX para cálculos USD |
| `VITE_X402_NETWORK` | Frontend | Red de pago (`fuji` o `mainnet`) |

---

## Desarrollo local

```bash
# Backend
npm install && npm run dev   # http://localhost:3001

# Frontend
cd ledgerlens-front && npm install && npm run dev   # http://localhost:5173
```

---

## Despliegue en Vercel

1. Conecta el repo [github.com/Kenyi001/ledgerlens](https://github.com/Kenyi001/ledgerlens) a Vercel.
2. **Build Command:** `cd ledgerlens-front && npm install && npm run build`
3. **Output Directory:** `ledgerlens-front/dist`
4. **Root Directory:** raíz del repo (contiene `vercel.json`)
5. Añade las variables de entorno requeridas en **Settings → Environment Variables**.
6. **Redeploy** para aplicar cambios.

El `vercel.json` en la raíz ya incluye rewrites y `maxDuration: 60` para `/api/analyze`.

---

## API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | Estado del servicio |
| GET | `/api/analyze/:address` | Analiza billetera (`?chain=avalanche|fuji|ethereum`) |

---

## Licencia

MIT · Aleph Hackathon 2026
