import type { SuiClientTypes } from "@mysten/sui/client";
import { fromBase64 } from "@mysten/sui/utils";
import { Config } from "../../config/index";
import { executeBluefinTx } from "../../libs/protocols/bluefinx/client";
import { BluefinXTx } from "../../libs/protocols/bluefinx/types";
import { AggregatorTx } from "../../types/aggregator";

/**
 * Execute a transaction after it is signed
 *
 * Automatically handle BluefinX transaction execution if needed
 * @example
 * ```ts
 * const { mutateAsync: signTransaction } = useSignTransaction();
 * const quoteResponse = await getQuote(...quoteParams);
 * const { tx } = await buildTx(...buildTxParams);
 * const {signature, bytes} = await signTransaction({
 *  transaction: tx instanceof BluefinXTx ? tx.txBytes : tx,
 * });
 * const res = await executeTx(tx, signature, bytes);
 * ```
 * @param tx - AggregatorTx - received from `buildTx`
 * @param signature - User signature after signing the transaction
 * @param signedTxBytes - Signed transaction bytes (base64) after signing the transaction
 * @param include - Options for which fields to include in the response
 * @returns `SuiClientTypes.TransactionResult`
 */
export const executeTx = async (
  tx: AggregatorTx,
  signature: string,
  signedTxBytes: string,
  include?: SuiClientTypes.TransactionInclude,
) => {
  const isBluefinTx = tx instanceof BluefinXTx;
  const client = Config.getSuiClient();
  let res: SuiClientTypes.TransactionResult;
  if (isBluefinTx) {
    try {
      const result = await executeBluefinTx(tx, signature);
      res = await client.core.waitForTransaction({
        digest: result.txDigest,
        include,
      });
    } catch (e) {
      throw Error(
        `Could not retrieve BluefinX transaction with quoteId: ${tx.quoteId} ${e}`,
      );
    }
  } else {
    res = await client.core.executeTransaction({
      transaction: fromBase64(signedTxBytes),
      signatures: [signature],
      include,
    });
  }

  return res;
};
