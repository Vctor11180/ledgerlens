/**
 * x402: middleware Express + PayAI facilitator (Avalanche C-Chain / Fuji).
 */

import { paymentMiddleware, x402ResourceServer } from "@x402/express";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { facilitator as payaiFacilitator } from "@payai/facilitator";

export function isX402Enabled() {
  const v = String(process.env.X402_ENABLED ?? "").toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}

/** @returns {"eip155:43114"|"eip155:43113"} */
export function getX402CaipNetwork() {
  const n = String(process.env.X402_NETWORK ?? "fuji").toLowerCase();
  if (n === "mainnet" || n === "c-chain" || n === "avalanche" || n === "43114") {
    return "eip155:43114";
  }
  return "eip155:43113";
}

export function usdcBaseUnitsToPriceString(unitsStr) {
  const u = BigInt(unitsStr || "0");
  const dollars = Number(u) / 1e6;
  if (!Number.isFinite(dollars) || dollars === 0) return "$0";
  const s = dollars.toFixed(6).replace(/\.?0+$/, "");
  return `$${s}`;
}

/**
 * Alias: el SDK @x402/core lee PAYMENT-SIGNATURE; la Academy usa X-PAYMENT en v1.
 */
export function x402PaymentHeaderAlias(req, res, next) {
  const x = req.headers["x-payment"];
  if (x && !req.headers["payment-signature"]) {
    req.headers["payment-signature"] = x;
  }
  next();
}

export function createX402PaymentMiddleware() {
  const payTo = process.env.X402_PAY_TO?.trim();
  if (!payTo) {
    throw new Error(
      "X402_PAY_TO es obligatorio cuando X402_ENABLED=true (dirección que recibe USDC)."
    );
  }

  const amountUnits = process.env.X402_AMOUNT_USDC || "10000";
  const price = usdcBaseUnitsToPriceString(amountUnits);
  const network = getX402CaipNetwork();

  const facilitatorUrl =
    process.env.X402_FACILITATOR_URL?.trim() || payaiFacilitator.url;

  const facilitator = new HTTPFacilitatorClient({
    url: facilitatorUrl,
    createAuthHeaders: payaiFacilitator.createAuthHeaders,
  });

  const server = new x402ResourceServer(facilitator).register(
    "eip155:*",
    new ExactEvmScheme()
  );

  const routes = {
    "GET /api/analyze/:address": {
      accepts: [
        {
          scheme: "exact",
          price,
          network,
          payTo,
        },
      ],
      description: "Análisis de billetera LedgerLens (Glacier + IA)",
      mimeType: "application/json",
    },
  };

  return paymentMiddleware(routes, server, undefined, undefined, true);
}
