import { getQuote } from "./src/features/swap/getQuote";
import { buildTx } from "./src/features/swap/buildTx";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { SuiClient } from "@mysten/sui/client";
import { BluefinXTx } from "./src/libs/protocols/bluefinx/types";
import { executeBluefinTx } from "./src/libs/protocols/bluefinx/client";
import { Transaction } from "@mysten/sui/dist/cjs/transactions";

async function main() {
  const signer = Ed25519Keypair.deriveKeypair("oppose update cancel subject pair glad recall neither credit twenty caution animal");
  const suiClient = new SuiClient({
    url: "https://fullnode.mainnet.sui.io:443"
  });
  const quoteResponse = await getQuote({
    tokenIn: "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
    tokenOut: "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI",
    amountIn: "20000000",
    taker: signer.toSuiAddress(),
    sources: ["bluefin","cetus"],
  });
  const buildTxResult = (await buildTx({
    quoteResponse,
    accountAddress: signer.toSuiAddress(),
    slippage: 0.01,
    commission: {
      partner: "0xc153c7f9a1d3bdf09bafb0c456985483136c21f09b99dca48f1cf96c244dca5d",
      commissionBps: 50,
    },
  })).tx as Transaction;
  buildTxResult.setSender(signer.toSuiAddress());
  const tx = await buildTxResult.build({client: suiClient});
  const result = await suiClient.signAndExecuteTransaction({
    transaction: tx,
    signer,
    options: {
      showEffects: true,
    },
  });
  console.log(result);
}

main();