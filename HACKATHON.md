# LedgerLens — Aleph Hackathon March 2026

## Tracks aplicables

| Track | Requisitos | Estado LedgerLens |
|-------|------------|-------------------|
| **Avalanche** | Glacier API, C-Chain, build.avax.network | ✅ Glacier, Avalanche C-Chain + Ethereum |
| **GenLayer** | Intelligent Contract, Testnet Bradbury, Optimistic Democracy | ✅ Contrato listo, deploy pendiente |

---

## Requisitos mínimos de submission

- [ ] **GitHub link** con código open-source
- [ ] **Demo video** (3 min, en inglés para judges)
- [ ] **Tracks seleccionados** en DoraHacks (Avalanche y/o GenLayer)
- [ ] **Contract address** (si aplicas a GenLayer y desplegaste)

---

## Qué necesitas para que funcione

### 1. Obligatorias (local + Vercel)

| Variable | Dónde obtener | Uso |
|----------|---------------|-----|
| `GLACIER_API_KEY` | [AvaCloud](https://app.avacloud.io/) | Transacciones on-chain (Avalanche + Ethereum) |
| `HUGGINGFACE_API_KEY` o `OPENAI_API_KEY` | [HF](https://huggingface.co/settings/tokens) / [OpenAI](https://platform.openai.com/api-keys) | IA para clasificar Humano vs Bot |

### 2. Para track GenLayer

| Variable | Dónde obtener | Uso |
|----------|---------------|-----|
| `GENLAYER_PRIVATE_KEY` | Wallet en GenLayer Testnet Bradbury | Deploy del contrato + llamadas |
| `GENLAYER_CONTRACT_ADDRESS` | Salida de `npm run deploy:genlayer` | Dirección del contrato desplegado |

**Pasos para GenLayer:**

1. Crear wallet en [GenLayer Testnet Bradbury](https://portal.genlayer.foundation/) y obtener fondos de faucet si hace falta.
2. Exportar clave privada (formato `0x...`).
3. Añadir a `.env`: `GENLAYER_PRIVATE_KEY=0x...`
4. Ejecutar: `npm run deploy:genlayer`
5. Copiar la dirección impresa y añadir: `GENLAYER_CONTRACT_ADDRESS=0x...`
6. Reiniciar backend.

---

## Herramientas y datos del hackathon

| Recurso | LedgerLens | Link |
|---------|------------|------|
| Avalanche Glacier API | ✅ Datos de txs | [AvaCloud](https://app.avacloud.io/) |
| Avalanche C-Chain | ✅ Chain 43114 | [build.avax.network](https://build.avax.network/) |
| GenLayer Testnet Bradbury | ✅ IA on-chain | [portal.genlayer.foundation](https://portal.genlayer.foundation/) |
| x402 (HTTP payment) | ❌ No implementado | [Workshop](https://x.com/alephhackathon/status/2034729201560096780) |

---

## Submission en DoraHacks

1. [Aleph Hackathon](https://dorahacks.io/hackathon/alephhackathonm26/detail)
2. Submit BUIDL → selecciona **Avalanche** y/o **GenLayer**
3. GitHub: `https://github.com/Kenyi001/ledgerlens`
4. Demo video: graba 3 min mostrando connect wallet → analyze → resultados
5. Si usas GenLayer: indica **contract address** en la descripción

**GenLayer track adicional:** también debes submitir en el [hackathon oficial GenLayer](https://portal.genlayer.foundation/#/hackathon) (hasta 3 abril).

---

## Checklist antes de seguir

Antes de avanzar, confirma que tienes:

- [ ] `GLACIER_API_KEY` en `.env` y en Vercel
- [ ] `HUGGINGFACE_API_KEY` o `OPENAI_API_KEY` en `.env` y en Vercel
- [ ] (GenLayer) `GENLAYER_PRIVATE_KEY` + contrato desplegado + `GENLAYER_CONTRACT_ADDRESS`
- [ ] Repo público en GitHub
- [ ] Demo video grabado
