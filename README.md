# LedgerLens

> Analizador financiero on-chain para billeteras Avalanche y Ethereum. Extrae transacciones, calcula estadísticas y usa IA para clasificar **Humano vs Bot** con perfilamiento de riesgo.  
> **Aleph Hackathon 2026**

→ **Hackathon:** [HACKATHON.md](./HACKATHON.md) · **Checklist:** [CHECKLIST.md](./CHECKLIST.md)

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | React 19 + Vite + TypeScript + Tailwind + wagmi + shadcn/ui |
| Backend | Node.js + Express + ES Modules + Vercel Serverless |
| L1 Datos | Avalanche Glacier API (C-Chain + Ethereum) |
| IA | Hugging Face (principal) → OpenAI (fallback) → GenLayer (opcional) |
| Wallet | MetaMask / Core (Avalanche + Ethereum) |

---

## Cómo obtener las API Keys (obligatorias)

### 1. GLACIER_API_KEY (obligatoria)

1. Entra a **[AvaCloud](https://app.avacloud.io/)** y crea una cuenta.
2. En el dashboard, ve a **API Keys** o **Developer**.
3. Crea una nueva API key.
4. Copia la key y úsala como `GLACIER_API_KEY` en tu `.env`.

La Glacier API es la fuente de datos para transacciones (Avalanche C-Chain + Ethereum).

### 2. Proveedor de IA (al menos uno)

**Hugging Face (recomendado, gratis):**
1. [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) → New token (tipo Read).
2. Añade `HUGGINGFACE_API_KEY=hf_...` en `.env`.

**OpenAI (respaldo):**
1. [platform.openai.com/api-keys](https://platform.openai.com/api-keys) → Create key.
2. Añade `OPENAI_API_KEY=sk-...` en `.env`.

---

## Desarrollo local

### 1. Configurar variables de entorno

```bash
cp .env.example .env
# Edita .env con:
#   GLACIER_API_KEY     (obligatoria)
#   HUGGINGFACE_API_KEY (o OPENAI_API_KEY)
```

### 2. Backend

```bash
npm install
npm run dev
```

API en `http://localhost:3001`.

### 3. Frontend

```bash
cd ledgerlens-front && npm install && npm run dev
```

Frontend en `http://localhost:5173`. En desarrollo usa `http://localhost:3001` para la API.

---

## Despliegue en Vercel

### 1. Subir a GitHub

```bash
cd ledgerlens-backend
git init
git add .
git commit -m "feat: LedgerLens MVP - Aleph Hackathon"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/ledgerlens.git
git push -u origin main
```

(Crea primero el repo vacío en GitHub.)

### 2. Conectar en Vercel

1. Entra a **[vercel.com](https://vercel.com)** e inicia sesión.
2. **Add New Project** → Importa tu repo de GitHub.
3. Vercel detectará la estructura:
   - **Root Directory**: dejar vacío (raíz del repo).
   - **Build Command**: `cd ledgerlens-front && npm install && npm run build`
   - **Output Directory**: `ledgerlens-front/dist`

4. En **Environment Variables** añade:
   - `GLACIER_API_KEY` (obligatoria)
   - `HUGGINGFACE_API_KEY` o `OPENAI_API_KEY` (al menos una)
   - `AVAX_USD_PRICE` = `35` (opcional)

5. Deploy.

La app quedará en `https://tu-proyecto.vercel.app`.  
El frontend y la API (`/api/analyze/:address`) comparten el mismo dominio.

---

## API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | Estado del servicio |
| GET | `/api/analyze/:address` | Analiza billetera (dirección EVM 0x...) |

### Formato de respuesta

```json
{
  "identity": "Verified Human User | High-Frequency Trading Bot | Smart Contract Service",
  "risk_score": 0,
  "narrative": "…",
  "chain": "avalanche",
  "transactions": [
    { "id": "0x...", "time": "…", "action": "Swap|Transfer|Approve|Bridge", "counterparty": "…", "gas_usd": 1.23, "value_native": 0.5, "value_usd": 17.5, "native_symbol": "AVAX" }
  ],
  "gas_efficiency": [ { "hour": "00:00", "gas_usd": 0, "avg_network": 0.21 } ]
}
```

**Query:** `?chain=avalanche` | `?chain=ethereum`

---

## Wallet (MetaMask / Core)

- Conecta wallet → la dirección se rellena automáticamente.
- Selector Avalanche / Ethereum → cambia la red en la wallet si hace falta.
- Balance visible en header cuando conectado.
- Ver [WALLET.md](./ledgerlens-front/WALLET.md) para detalles.

---

## GenLayer (IA descentralizada)

Para usar el consenso LLM de GenLayer en lugar de OpenAI:

1. Despliega el contrato: `npm run deploy:genlayer` (requiere `GENLAYER_PRIVATE_KEY`).
2. Añade `GENLAYER_CONTRACT_ADDRESS` al `.env`.
3. El backend usará GenLayer automáticamente; si falla, hace fallback a OpenAI.

Ver [GENLAYER.md](./GENLAYER.md) para la guía completa.

---

## Arquitectura

```
Frontend (React)  →  GET /api/analyze/:address
                            ↓
                    analyze.controller
                            ↓
        ┌───────────────────┼───────────────────┐
        ↓                   ↓                   ↓
  avalanche.service   aggregator.service   ai.service
  (Glacier API)       (mapea formato)      (OpenAI → GenLayer mañana)
```

Módulos pensados para poder sustituir el servicio de IA por GenLayer sin romper el flujo.

---

## Licencia

MIT · Aleph Hackathon 2026
