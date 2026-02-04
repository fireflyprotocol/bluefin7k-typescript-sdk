export type BluefinXV2Extra = {
  quoteId: string;
  signature: string;
  vault: string;
  /** Original quote token_in_amount (used for signature verification) */
  tokenInAmount: string;
  /** Original quote token_out_amount (used for signature verification) */
  tokenOutAmount: string;
  /** Actual swap amount from SOR (for partial quote execution) */
  swapAmount?: string;
  quoteExpiresAtUtcMillis: number;
  createdAtUtcMillis: number;
  // V2 specific: No taker field since anyone can execute
};
