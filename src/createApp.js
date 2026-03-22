/**
 * Aplicación Express compartida: servidor local y Vercel serverless.
 */

import "dotenv/config";
import express from "express";
import cors from "cors";
import { analyzeAddress } from "./controllers/analyze.controller.js";
import { runAgentController } from "./controllers/agent.controller.js";
import {
  isX402Enabled,
  createX402PaymentMiddleware,
  x402PaymentHeaderAlias,
} from "./x402/expressSetup.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: true,
      exposedHeaders: [
        "PAYMENT-REQUIRED",
        "PAYMENT-RESPONSE",
        "X-PAYMENT-RESPONSE",
      ],
    })
  );
  app.use(express.json());
  app.use(x402PaymentHeaderAlias);

  if (isX402Enabled()) {
    app.use(createX402PaymentMiddleware());
  }

  app.get("/health", (_, res) => {
    res.json({ status: "ok", service: "ledgerlens-backend" });
  });

  app.get("/api/analyze/:address", analyzeAddress);
  app.get("/api/run-agent", runAgentController);

  app.use((_, res) => {
    res.status(404).json({ error: "Not Found", message: "Ruta no encontrada" });
  });

  return app;
}
