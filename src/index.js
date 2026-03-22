/**
 * LedgerLens Backend — API de análisis de billeteras Avalanche
 * Aleph Hackathon 2026
 */

import { createApp } from "./createApp.js";

const PORT = process.env.PORT || 3001;
const app = createApp();

app.listen(PORT, () => {
  console.log(`[LedgerLens] API listening on http://localhost:${PORT}`);
  console.log(`[LedgerLens] GET /api/analyze/:address — analizar billetera`);
});
