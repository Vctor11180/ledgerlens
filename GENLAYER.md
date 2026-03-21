# GenLayer - LedgerLens Integration

LedgerLens usa GenLayer para el análisis IA descentralizado (Humano vs Bot) mediante Intelligent Contracts y consenso LLM.

## Arquitectura

```
Frontend → GET /api/analyze/:address
    → Avalanche Glacier (transacciones)
    → Aggregator (formato + resumen)
    → ai.service.js
        ├─ GenLayer (si GENLAYER_* configurado)
        │   └─ wallet_analyzer.py (Intelligent Contract)
        └─ OpenAI (fallback)
```

## Contrato: `contracts/wallet_analyzer.py`

- **`analyze_wallet(statistical_summary: str)`** — write: llama al LLM con consenso, guarda el veredicto.
- **`get_last_verdict()`** — view: devuelve `{ identity, risk_score, narrative }`.

Usa `gl.vm.run_nondet_unsafe` con validador para respuestas JSON no deterministas.

## Desplegar el contrato

### 1. GenLayer CLI

```bash
npm install -g @genlayer/cli
genlayer deploy --contract contracts/wallet_analyzer.py --args
```

### 2. GenLayer Studio

1. Entra a [GenLayer Studio](https://studio.genlayer.com)
2. Crea proyecto y pega el código de `contracts/wallet_analyzer.py`
3. Despliega en **Testnet Bradbury** (recomendado para LLM)
4. Copia la dirección del contrato

### 3. Deploy script con genlayer-js

```js
import { createClient, createAccount } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";
import { readFileSync } from "fs";
import { TransactionStatus } from "genlayer-js/types";

const account = createAccount(process.env.GENLAYER_PRIVATE_KEY);
const client = createClient({ chain: testnetBradbury, account });
await client.initializeConsensusSmartContract();

const code = readFileSync("./contracts/wallet_analyzer.py", "utf-8");
const hash = await client.deployContract({ code, args: [], leaderOnly: false });
const receipt = await client.waitForTransactionReceipt({
  hash,
  status: TransactionStatus.ACCEPTED,
  retries: 60,
  interval: 5000,
});
console.log("Contract:", receipt.data?.contract_address);
```

## Configuración Backend

En `.env`:

```env
# GenLayer (opcional; si no se usa, se usa OpenAI)
GENLAYER_CONTRACT_ADDRESS=0x...
GENLAYER_PRIVATE_KEY=0x...
```

- Si `GENLAYER_CONTRACT_ADDRESS` y `GENLAYER_PRIVATE_KEY` están definidos → se usa GenLayer.
- Si falla GenLayer o no está configurado → se usa OpenAI.

## Validación del contrato

### Esquema

```bash
npx genlayer schema contracts/wallet_analyzer.py
```

O con genlayer-js:

```js
const schema = await client.getContractSchemaForCode({
  code: readFileSync("./contracts/wallet_analyzer.py", "utf-8"),
});
```

### Contrato con el frontend

El backend siempre responde:

```json
{
  "identity": "Verified Human User | High-Frequency Trading Bot | Smart Contract Service",
  "risk_score": 0-100,
  "narrative": "...",
  "transactions": [...],
  "gas_efficiency": [...]
}
```

Tanto GenLayer como OpenAI devuelven `identity`, `risk_score` y `narrative` en ese formato.

## Redes GenLayer

| Red             | Uso                                  |
|-----------------|--------------------------------------|
| localnet        | Desarrollo local                     |
| studionet       | Prototipado en equipo                |
| testnetAsimov   | Infraestructura y estabilidad        |
| testnetBradbury | Cargas de trabajo LLM reales (recomendado) |

## Referencias

- [GenLayer Docs](https://docs.genlayer.com)
- [Testnet Bradbury](https://www.genlayer.com/news/announcing-testnet-bradbury)
- [genlayer-js](https://github.com/genlayerlabs/genlayer-js)
