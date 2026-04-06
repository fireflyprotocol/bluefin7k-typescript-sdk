import { MIN_SQRT_PRICE, MAX_SQRT_PRICE } from "./constants.js";

export function getDefaultSqrtPriceLimit(a2b: boolean): bigint {
  return BigInt(a2b ? MIN_SQRT_PRICE : MAX_SQRT_PRICE);
}
