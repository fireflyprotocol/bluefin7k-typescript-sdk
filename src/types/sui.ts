import { TransactionResult } from "@mysten/sui/transactions";
import { Unarray } from "./utilities.js";

export type TransactionResultItem = Unarray<TransactionResult>;
