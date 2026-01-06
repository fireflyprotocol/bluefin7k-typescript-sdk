import { bcs } from "@mysten/sui/bcs";
import { Transaction } from "@mysten/sui/transactions";
import {
  fromBase64,
  normalizeStructTag,
  SUI_CLOCK_OBJECT_ID,
} from "@mysten/sui/utils";
import { SuiUtils } from "../../../utils/sui";
import { BaseContract } from "../base";
import type { BluefinXV2Extra } from "./types";

// BCS structure for QuoteV2 (no taker field)
// IMPORTANT: Field order must match Move struct exactly!
const BcsQuoteV2 = bcs.struct("QuoteV2", {
  vault: bcs.Address,
  id: bcs.string(),
  token_in_amount: bcs.u64(),
  token_out_amount: bcs.u64(),  // Fixed: must come before token_in_type
  token_in_type: bcs.string(),   // Fixed: must come after token_out_amount
  token_out_type: bcs.string(),
  expires_at: bcs.u64(),
  created_at: bcs.u64(),
});

export class BluefinXV2Contract extends BaseContract {
  async swap(tx: Transaction) {
    const extra = this.extra as BluefinXV2Extra;

    // Serialize QuoteV2 (without taker field)
    // Field order MUST match Move struct!
    const quoteBytes = BcsQuoteV2.serialize({
      vault: extra.vault,
      id: extra.quoteId,
      token_in_amount: this.swapInfo.amount,
      token_out_amount: this.swapInfo.returnAmount,  // Before token types
      token_in_type: normalizeStructTag(this.swapInfo.assetIn).slice(2),
      token_out_type: normalizeStructTag(this.swapInfo.assetOut).slice(2),
      expires_at: extra.quoteExpiresAtUtcMillis,
      created_at: extra.createdAtUtcMillis,
    }).toBytes();

    // Convert input coin to balance
    const inputBalance = SuiUtils.coinIntoBalance(
      tx,
      this.swapInfo.assetIn,
      this.inputCoinObject
    );

    // Check if swap via partner is enabled
    if (this.config.swapViaPartner) {
      // Call vault::swap_via_partner_v2
      const [out, fee] = tx.moveCall({
        arguments: [
          tx.object(SUI_CLOCK_OBJECT_ID),
          tx.object(extra.vault),
          tx.object(this.config.bluefinx.globalConfig),
          tx.pure.vector("u8", Array.from(quoteBytes)),
          tx.pure.vector("u8", Array.from(fromBase64(extra.signature))),
          inputBalance,
          tx.pure.u64(this.swapInfo.amount), // swap_amount parameter for partial fills
          tx.pure.address(this.config.swapViaPartner.partnerAddress),
          tx.pure.u64(this.config.swapViaPartner.feePercentage1e6),
        ],
        target: `${this.config.bluefinx.package}::vault::swap_via_partner_v2`,
        typeArguments: [this.swapInfo.assetIn, this.swapInfo.assetOut],
      });

      // Transfer partner fee
      const feeCoin = SuiUtils.coinFromBalance(tx, this.swapInfo.assetOut, fee);
      tx.transferObjects([feeCoin], this.config.swapViaPartner.partnerAddress);

      // Return output coin
      return SuiUtils.coinFromBalance(tx, this.swapInfo.assetOut, out);
    } else {
      // Call vault::swap_v2
      const [out] = tx.moveCall({
        arguments: [
          tx.object(SUI_CLOCK_OBJECT_ID),
          tx.object(extra.vault),
          tx.object(this.config.bluefinx.globalConfig),
          tx.pure.vector("u8", Array.from(quoteBytes)),
          tx.pure.vector("u8", Array.from(fromBase64(extra.signature))),
          inputBalance,
          tx.pure.u64(this.swapInfo.amount), // swap_amount parameter for partial fills
        ],
        target: `${this.config.bluefinx.package}::vault::swap_v2`,
        typeArguments: [this.swapInfo.assetIn, this.swapInfo.assetOut],
      });

      // Return output coin
      return SuiUtils.coinFromBalance(tx, this.swapInfo.assetOut, out);
    }
  }
}

export { BluefinXV2Extra } from "./types";
