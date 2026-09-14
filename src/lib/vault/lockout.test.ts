import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { backoffMs, nextLockout, remainingMs } from "./lockout.ts";

describe("PIN lockout policy", () => {
  it("does not lock before 5 failures", () => {
    assert.equal(backoffMs(1), 0);
    assert.equal(backoffMs(4), 0);
    const next = nextLockout({ fails: 3, until: 0 }, 1_000);
    assert.equal(next.fails, 4);
    assert.equal(next.until, 0);
  });

  it("locks 30s after the 5th failure", () => {
    assert.equal(backoffMs(5), 30_000);
    const next = nextLockout({ fails: 4, until: 0 }, 10_000);
    assert.equal(next.fails, 5);
    assert.equal(next.until, 40_000);
  });

  it("escalates to 2 minutes then 15 minutes", () => {
    assert.equal(backoffMs(8), 120_000);
    assert.equal(backoffMs(10), 900_000);
  });

  it("reports remaining cooldown", () => {
    assert.equal(remainingMs({ fails: 5, until: 20_000 }, 5_000), 15_000);
    assert.equal(remainingMs({ fails: 5, until: 20_000 }, 25_000), 0);
  });
});
