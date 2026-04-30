import { assert } from "chai";
import { computeGasBudget } from "../src/features/swap/buildTx.js";

const MIN = 1_000_000n;
const MAX = 500_000_000n;

describe("computeGasBudget", () => {
  it("uses netGas * 2 for positive net (typical aggregator swap)", () => {
    const budget = computeGasBudget({
      computationCost: 2_133_000n,
      netGas: 1_038_348n,
    });
    assert.equal(budget, 2_076_696n);
  });

  it("falls back to computationCost * 2 when net is negative (BET-3616)", () => {
    const budget = computeGasBudget({
      computationCost: 2_500_000n,
      netGas: -26_279_704n,
    });
    assert.equal(budget, 5_000_000n);
  });

  it("falls back to computationCost * 2 when net is exactly zero", () => {
    const budget = computeGasBudget({
      computationCost: 1_500_000n,
      netGas: 0n,
    });
    assert.equal(budget, 3_000_000n);
  });

  it("clamps to MIN_GAS_BUDGET when computation is tiny and net is negative", () => {
    const budget = computeGasBudget({
      computationCost: 100_000n,
      netGas: -5_000_000n,
    });
    assert.equal(budget, MIN);
  });

  it("clamps to MAX_GAS_BUDGET when net*2 exceeds the ceiling", () => {
    const budget = computeGasBudget({
      computationCost: 1_000_000n,
      netGas: 400_000_000n,
    });
    assert.equal(budget, MAX);
  });

  it("expands ceiling above MAX when netGas alone exceeds it", () => {
    const budget = computeGasBudget({
      computationCost: 1_000_000n,
      netGas: 700_000_000n,
    });
    assert.equal(budget, 700_000_000n);
  });

  it("reproduces Chris's failing case from BET-3616", () => {
    const budget = computeGasBudget({
      computationCost: 2_000_000n,
      netGas: -26_279_704n,
    });
    assert.isAtLeast(Number(budget), Number(2_000_000n));
    assert.equal(budget, 4_000_000n);
  });
});
