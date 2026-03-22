# Wallet y redes: quitar una conexión y usar otra

## En la app (LedgerLens)

1. **Salir** — Cierra la sesión wagmi en la app (no borra la extensión).
2. **Cambiar wallet** — Desconecta y **abre el menú** para elegir de nuevo **MetaMask** o **Browser wallet (Core, etc.)** sin buscar el botón.
3. Al elegir un conector en el menú, la app **intenta desconectar antes** si había otra sesión activa, para no mezclar dos proveedores.

## Red (Avalanche / Ethereum)

- El selector **Avalanche | Ethereum** define **qué cadena consulta el análisis** en el backend (Glacier).
- La wallet **no tiene que estar en la misma red** que el análisis: solo hace falta para firmar pagos x402.

## Pago x402 (USDC) — Fuji testnet

Si el backend tiene `X402_ENABLED=true`, al pulsar **Analyze** con wallet conectada la app intenta cambiar a la red de cobro configurada (`VITE_X402_NETWORK`: **fuji** o **mainnet** en Avalanche). Necesitas USDC en esa red.

- **USDC en Fuji (testnet):** contrato típico `0x5425890298aed601595a70AB815c96711a31Bc65`. Faucet y pasos en la [Academy x402 / environment setup](https://build.avax.network/academy/blockchain/x402-payment-infrastructure/05-hands-on-implementation/01-environment-setup) y recursos del [Builder Hub](https://build.avax.network/).

## En MetaMask / Core (extensión)

- **Otra cuenta:** icono de cuenta → elige otra dirección; la app actualiza el input al conectar.
- **Otra red:** selector de red en la extensión, o acepta el popup cuando la app pide cambiar de red.
- **Desconectar del sitio:** MetaMask → Conectado → tres puntos → “Desconectar de este sitio” (si quieres resetear por completo).

## Resumen rápido

| Quieres…              | Haz…                                      |
|-----------------------|-------------------------------------------|
| Pasar de Core a MetaMask | **Cambiar wallet** → **MetaMask**      |
| Otra dirección        | Cambiar cuenta en la extensión o **Cambiar wallet** |
| Solo analizar otra red| Selector **Avalanche / Ethereum** (y aceptar en la wallet si pide cambiar red) |
