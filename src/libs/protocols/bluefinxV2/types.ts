export type BluefinXV2Extra = {
  quoteId: string;
  signature: string;
  vault: string;
  quoteExpiresAtUtcMillis: number;
  createdAtUtcMillis: number;
  // V2 specific: No taker field since anyone can execute
};
