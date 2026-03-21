/**
 * Vercel Serverless Function: GET /api/analyze/:address
 * Wrapper para el controlador de análisis (mantiene la arquitectura modular)
 */

import "dotenv/config";
import { analyzeAddress } from "../../src/controllers/analyze.controller.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const base = `http://${req.headers?.host || "localhost"}`
  const url = new URL(req.url || "/", base)
  const path = url.pathname
  const segments = path.split("/").filter(Boolean)
  const address = segments[segments.length - 1] || ""

  req.params = { address }
  req.query = Object.fromEntries(url.searchParams)
  await analyzeAddress(req, res)
}
