# Validación: datos on-chain vs demo

## Validación automatizada

```bash
# 1. GenLayer (contrato y conexión)
npm run verify:genlayer

# 2. Build del frontend
npm run validate:build

# 3. Backend (con servidor corriendo en otra terminal)
npm run dev          # Terminal 1
npm run validate     # Terminal 2
```

| Comando | Qué valida |
|---------|------------|
| `npm run verify:genlayer` | Lectura/escritura del contrato en StudioNet |
| `npm run validate:build` | Frontend compila sin errores (tsc + vite build) |
| `npm run validate` | `/health`, `/api/analyze` (Avalanche), dirección inválida → 400 |

**Nota:** Glacier API puede devolver 404 para `chain=ethereum` según el plan; Avalanche C-Chain (43114) está soportado.

---

## Origen de los datos

| Capa | Fuente | ¿Blockchain real? |
|------|--------|---------------------|
| **Transacciones** (`id`, `time`, `counterparty`, `gas_usd`) | [Avalanche Glacier](https://developers.avacloud.io/data-api/address-transactions) (`glacier-api.avax.network`) indexando C-Chain / Ethereum | **Sí** — hashes y timestamps vienen del índice oficial |
| **Clasificación** (`identity`, `risk_score`, `narrative`) | IA en servidor (GenLayer / HF / OpenAI según `.env`) | Inferencia sobre el resumen estadístico; **no** es un “mock” fijo en el front |

El frontend **no** inventa transacciones: solo muestra el JSON del backend.

## Comprobar un hash en Avalanche C-Chain

1. Llama a la API y copia un `transactions[].id` (tx hash `0x…`).
2. Consulta el RPC público:

```bash
curl -s https://api.avax.network/ext/bc/C/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getTransactionByHash","params":["<TX_HASH>"],"id":1}'
```

Si `result` no es `null`, la transacción existe en C-Chain (`chainId` en el resultado suele ser `0xa86a` = 43114).

## Ejemplo verificado (marzo 2026)

- Dirección: `0x8dc08e5055e49b6F9d96aDC4AC277fDe44028367`, `chain=avalanche`.
- Primer hash devuelto: `0x057cdd9ff32446388db4950d0d5e614f6d9b924f9886be38424e421fec52c942`.
- Verificación: `eth_getTransactionByHash` en `https://api.avax.network/ext/bc/C/rpc` devolvió bloque, `from`, `to`, y `chainId: 0xa86a`.

## Requisitos

- `GLACIER_API_KEY` en `.env` (clave en [AvaCloud](https://app.avacloud.io/)).
- Sin API key, el backend no puede leer la cadena y no hay datos de sustituto automático.

---

## Cómo validar lo que ves en el dashboard (por bloque)

### 1. Identity + Risk + Narrativa (“High-Frequency Trading Bot”, 80/100, etc.)

| Qué es | Cómo validarlo |
|--------|----------------|
| **No es** una certificación KYC ni prueba de que eres un bot. | Es salida de **IA** sobre un **resumen estadístico** de tus últimas txs (Glacier → agregador → prompt). |
| **Coherencia** | Lee la narrativa: ¿menciona patrones que reconoces (muchos swaps, mismas DApps)? |
| **Cuenta de tutorial / prueba** | Si solo hiciste pasos de un curso (swap, bridge de prueba), el modelo puede **interpretar** “mucha actividad tipo DEX” como parecido a trading automatizado. Eso **no** significa que la wallet sea un bot; es una **heurística** sobre datos limitados (p. ej. últimas 50 txs). |

**Conclusión:** úsalo como **indicador orientativo**, no como verdad legal o técnica definitiva.

### 2. Tabla “Recent Transactions” (time, action, counterparty, gas)

| Campo | Verificable |
|-------|-------------|
| **Hash (`id`)** | **Sí** — en la app, el hash enlaza a **Snowtrace** (Avalanche) o **Etherscan** (Ethereum). Ahí ves bloque, hora, `from`/`to`, valor y gas **reales**. |
| **Time** | Debe coincidir (en UTC/ISO) con el explorador. |
| **Action** (Swap, Transfer, …) | **Heurística del backend** (selector de método / tipo de llamada). Puede no coincidir al 100 % con cómo tú nombrarías la operación; contrasta con el **input data** en el explorador. |
| **Gas (USD)** | Estimación: `gasUsed × gasPrice` en nativo × `AVAX_USD_PRICE` (o equivalente en ETH). Valores **muy bajos o $0.00** pueden deberse a redondeo o a precio fijo en `.env`; el **gas en nativo** en el explorador es la referencia fina. |

### 3. Gráfico “Gas vs network average”

- **Tu curva** agrega el gasto estimado de tus txs por franja horaria.
- **avg_network** en el agregador es un valor orientativo para comparar; no es un oráculo de mercado en tiempo real.
- Si ves **$0** en la wallet pero txs en cadena, revisa redondeo y `AVAX_USD_PRICE` en el backend.

### 4. Checklist rápido

1. Abre un **hash** desde la tabla → comprueba en Snowtrace que la tx existe y la fecha cuadra.
2. Trata **identity / risk / narrativa** como opinión de modelo, especialmente si la cuenta fue solo para **tutorial**.
3. Ajusta expectativas: **mismos datos on-chain** pueden generar **otra narrativa** si cambias de modelo de IA o de prompt en el servidor.
