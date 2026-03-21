# LedgerLens — Checklist de completado

→ **Requisitos Aleph Hackathon:** [HACKATHON.md](./HACKATHON.md)

## ✅ Completado

| Item | Estado |
|------|--------|
| Backend Express + Glacier API | ✅ |
| Soporte Avalanche + Ethereum | ✅ |
| IA: Hugging Face → OpenAI fallback | ✅ |
| Frontend React + Vite + TypeScript | ✅ |
| Conexión wallet (wagmi: MetaMask, Core) | ✅ |
| Balance y "Analizar mi wallet" | ✅ |
| Tabla de txs con Amount, Fecha, enlaces explorer | ✅ |
| Resumen stats (transacciones, gas, volumen) | ✅ |
| Validación on-chain (VALIDATION.md) | ✅ |
| Despliegue Vercel (API + SPA) | ✅ |
| Documentación README, DEPLOY_VERCEL, WALLET | ✅ |

---

## ⏳ Pendiente (acción manual)

### 1. Variables de entorno en `.env` (local)

Copia `.env.example` a `.env` y rellena:

```env
# Obligatorias
GLACIER_API_KEY=tu_key_de_avacloud
HUGGINGFACE_API_KEY=hf_tu_token
# o en su lugar: OPENAI_API_KEY=sk-...

# Opcionales
AVAX_USD_PRICE=35
ETH_USD_PRICE=3500
```

**Sin estas keys el análisis fallará** con:
- `GLACIER_API_KEY no configurada`
- `No hay proveedor IA configurado`

### 2. Variables en Vercel (producción)

En [vercel.com](https://vercel.com) → tu proyecto → **Settings** → **Environment Variables**:

| Variable | Obligatoria |
|----------|-------------|
| `GLACIER_API_KEY` | Sí |
| `HUGGINGFACE_API_KEY` o `OPENAI_API_KEY` | Sí (al menos una) |

Luego **Redeploy** para que apliquen.

### 3. Wallet para pruebas

- Instala **MetaMask** o **Core** en el navegador.
- Añade **Avalanche C-Chain** (43114) y **Ethereum** si quieres probar ambas redes.

---

## 🔗 Links útiles

- **Glacier API Key:** https://app.avacloud.io/
- **Hugging Face Token:** https://huggingface.co/settings/tokens
- **OpenAI API Key:** https://platform.openai.com/api-keys
- **Vercel Dashboard:** https://vercel.com/dashboard

---

## Probar que todo funciona

1. Backend: `npm run dev` → `http://localhost:3001/api/health` devuelve `{"status":"ok"}`.
2. Frontend: `cd ledgerlens-front && npm run dev` → abre `http://localhost:5173`.
3. Pega una dirección (ej. `0x8dc08e5055e49b6F9d96aDC4AC277fDe44028367`) y clic **Analyze**.
4. O conecta wallet y usa **Analizar mi wallet**.
