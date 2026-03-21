# LedgerLens

> Analizador financiero on-chain para billeteras Avalanche. Extrae transacciones, calcula estadísticas y usa IA para clasificar **Humano vs Bot** con perfilamiento de riesgo.  
> **Aleph Hackathon 2026** · MVP en 48h

## Stack (Bloqueado para el Hackathon)

| Capa | Tecnología |
|------|------------|
| Frontend | React 18 + Vite + TypeScript + Tailwind + shadcn/ui |
| Backend | Node.js + Express + ES Modules |
| L1 Datos | Avalanche Glacier API (C-Chain) |
| IA (MVP) | OpenAI / Gemini / Claude (mañana: GenLayer Testnet) |

---

## Cómo obtener las API Keys

### 1. GLACIER_API_KEY (Avalanche)

1. Entra a **[AvaCloud](https://app.avacloud.io/)** y crea una cuenta.
2. En el dashboard, ve a **API Keys** o **Developer**.
3. Crea una nueva API key.
4. Copia la key y úsala como `GLACIER_API_KEY` en tu `.env`.

La Glacier API es la fuente de datos para las transacciones de la C-Chain de Avalanche.

### 2. OPENAI_API_KEY

1. Entra a **[platform.openai.com](https://platform.openai.com/api-keys)**.
2. Crea una API key (formato `sk-...`).
3. Úsala como `OPENAI_API_KEY` en tu `.env`.

---

## Desarrollo local

### Backend

```bash
cd ledgerlens-backend
cp .env.example .env
# Edita .env con GLACIER_API_KEY y OPENAI_API_KEY
npm install
npm start
```

API en `http://localhost:3001`.

### Frontend

```bash
cd ledgerlens-front
npm install
npm run dev
```

Frontend en `http://localhost:5173`. En desarrollo apunta a `http://localhost:3001` para la API.

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
   - `GLACIER_API_KEY` = tu key de AvaCloud
   - `OPENAI_API_KEY` = tu key de OpenAI
   - `AVAX_USD_PRICE` = `35` (opcional, para estimar gas en USD)

5. Deploy.

La app quedará en `https://tu-proyecto.vercel.app`.  
El frontend y la API (`/api/analyze/:address`) comparten el mismo dominio.

---

## API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | Estado del servicio |
| GET | `/api/analyze/:address` | Analiza billetera (dirección EVM 0x...) |

### Formato de respuesta (contrato con el Frontend)

```json
{
  "identity": "Verified Human User | High-Frequency Trading Bot | Smart Contract Service",
  "risk_score": 0,
  "narrative": "…",
  "transactions": [
    { "id": "0x...", "time": "…", "action": "Swap|Transfer", "counterparty": "…", "gas_usd": 1.23 }
  ]
}
```

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
