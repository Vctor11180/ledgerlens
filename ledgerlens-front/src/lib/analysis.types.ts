/**
 * Formato de respuesta de GET /api/analyze/:address (backend LedgerLens).
 * No incluye datos de prueba: solo tipos compartidos por el dashboard.
 */
export interface Transaction {
  id: string
  time: string
  /** Etiqueta legible (derivada de Glacier: methodName, selector, ERC-20, etc.) */
  action: string
  /** Movimiento principal respecto a tu dirección (para UI tipo wallet) */
  flow?: "in" | "out" | "neutral"
  counterparty: string
  gas_usd: number
  /** Monto en token nativo (AVAX/ETH) */
  value_native?: number
  /** Monto estimado en USD */
  value_usd?: number
  /** Símbolo: AVAX | ETH */
  native_symbol?: string
  /** Movimiento ERC-20 principal (Glacier erc20Transfers), p. ej. USDC */
  token_amount?: number
  token_symbol?: string
  /** USD si Glacier envía precio del token */
  token_value_usd?: number
  /** Indica si la IA/Backend detectó un posible scam (ej. caracteres cirílicos) */
  is_scam?: boolean
}

export interface GasDataPoint {
  hour: string
  gas_usd: number
  tx_count?: number
}

export interface AnalysisResult {
  identity: string
  risk_score: number
  narrative: string
  transactions: Transaction[]
  gas_efficiency: GasDataPoint[]
  /** Red usada para el análisis (viene del backend) */
  chain?: string
  /** Hash de tx de liquidación USDC (x402), si aplica */
  payment_tx_hash?: string
  /** Detalles agregados de los fondos para el dashbard */
  wallet_summary?: {
    current_balance_native: number;
    total_received_usd: number;
    total_sent_usd: number;
    total_gas_spent_usd: number;
  }
}
