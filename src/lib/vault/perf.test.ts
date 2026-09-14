import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { coerceVault } from "./coerce.ts";
import { completenessScore, totalValue, valueByCategory } from "./completeness.ts";
import { openVault, resealVault, sealVault } from "./crypto.ts";
import { formatThb } from "./format.ts";
import { emptyVault } from "./seed.ts";
import type { VaultData } from "./types.ts";

function estate(n: number): VaultData {
  const vault = emptyVault("Load Test");
  vault.assets = Array.from({ length: n }, (_, i) => ({
    id: `a${i}`,
    category: (["banking", "property", "investment", "crypto", "other"] as const)[i % 5]!,
    name: `Asset ${i} กขคง ${"x".repeat(12)}`,
    institution: "Bank of Load",
    identifier: `ID-${i}`,
    valueThb: (i + 1) * 10_000,
    location: "Bangkok",
    notes: "note",
    beneficiaryIds: [],
    secret: i % 7 === 0 ? `secret-${i}` : "",
    marital: "unknown" as const,
    updatedAt: new Date().toISOString(),
  }));
  vault.beneficiaries = Array.from({ length: Math.min(40, Math.ceil(n / 10)) }, (_, i) => ({
    id: `h${i}`,
    name: `Heir ${i}`,
    relationship: "child" as const,
    sharePercent: i === 0 ? 40 : 2,
    email: `h${i}@family.test`,
    phone: "0812345678",
    notes: "",
  }));
  return vault;
}

function ms(start: bigint): number {
  return Number(process.hrtime.bigint() - start) / 1e6;
}

describe("performance & load", () => {
  it("scores and filters a 400-asset estate quickly", () => {
    const vault = estate(400);
    const t0 = process.hrtime.bigint();
    const score = completenessScore(vault);
    const worth = totalValue(vault);
    const mix = valueByCategory(vault);
    const q = "asset 12";
    const hits = vault.assets.filter((a) => a.name.toLowerCase().includes(q)).length;
    const labels = vault.assets.map((a) => formatThb(a.valueThb, "th"));
    const elapsed = ms(t0);
    assert.ok(score >= 0);
    assert.ok(worth > 0);
    assert.ok(mix.length >= 1);
    assert.ok(hits >= 1);
    assert.equal(labels.length, 400);
    assert.ok(elapsed < 80, `cpu path too slow: ${elapsed.toFixed(1)}ms`);
  });

  it("seals, reseals, and opens mid-size and large vaults under budget", async () => {
    const pin = "258036";
    const mid = estate(80);
    const tSeal = process.hrtime.bigint();
    const blob = await sealVault(mid, pin);
    const sealMs = ms(tSeal);
    const tOpen = process.hrtime.bigint();
    const opened = await openVault<VaultData>(blob, pin);
    const openMs = ms(tOpen);
    const coerced = coerceVault(opened.data);
    assert.equal(coerced?.assets.length, 80);

    const tReseal = process.hrtime.bigint();
    for (let i = 0; i < 8; i++) {
      await resealVault(mid, opened.key, blob.salt);
    }
    const resealMs = ms(tReseal) / 8;

    const large = estate(250);
    const tLarge = process.hrtime.bigint();
    const largeBlob = await sealVault(large, pin);
    const openedLarge = await openVault<VaultData>(largeBlob, pin);
    const largeMs = ms(tLarge);
    assert.equal(openedLarge.data.assets.length, 250);

    // Unlock is PBKDF2-bound (~300-2500ms at 600k). Reseal (save) should stay snappy.
    assert.ok(sealMs < 4000, `seal 80 too slow: ${sealMs.toFixed(0)}ms`);
    assert.ok(openMs < 4000, `open 80 too slow: ${openMs.toFixed(0)}ms`);
    assert.ok(resealMs < 60, `reseal too slow: ${resealMs.toFixed(1)}ms`);
    assert.ok(largeMs < 8000, `seal+open 250 too slow: ${largeMs.toFixed(0)}ms`);
  });
});
