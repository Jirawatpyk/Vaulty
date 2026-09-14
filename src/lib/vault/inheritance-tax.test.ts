import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { estimateInheritanceTax, INHERITANCE_ALLOWANCE, RATE_LINEAL, RATE_OTHER } from "./inheritance-tax.ts";
import { createDemoVault, emptyVault } from "./seed.ts";
import type { VaultData } from "./types.ts";

function heir(vault: ReturnType<typeof emptyVault>, rel: VaultData["beneficiaries"][number]["relationship"], name = "A") {
  vault.beneficiaries.push({
    id: "h1",
    name,
    relationship: rel,
    sharePercent: 100,
    email: "",
    phone: "",
    notes: "",
  });
}

function land(vault: ReturnType<typeof emptyVault>, value: number, heirId = "h1") {
  vault.assets.push({
    id: "land",
    category: "property",
    name: "ที่ดิน",
    institution: "",
    identifier: "",
    valueThb: value,
    location: "",
    notes: "",
    beneficiaryIds: [heirId],
    secret: "",
    marital: "separate",
    updatedAt: new Date().toISOString(),
  });
}

describe("Thai inheritance tax estimate", () => {
  it("demo family is under the 100 million allowance", () => {
    const est = estimateInheritanceTax(createDemoVault("th"));
    assert.equal(est.anyoneLiable, false);
    assert.equal(est.totalTax, 0);
    assert.ok(est.rows.every((r) => r.received < INHERITANCE_ALLOWANCE));
    const spouse = est.rows.find((r) => r.relationship === "spouse");
    assert.equal(spouse?.band, "exempt");
    assert.equal(spouse?.tax, 0);
  });

  it("charges 5% on a child's amount over 100 million", () => {
    const vault = emptyVault("เจ้าของ");
    heir(vault, "child", "ลูก");
    land(vault, 120_000_000);
    const est = estimateInheritanceTax(vault);
    assert.equal(est.rows[0]!.taxable, 20_000_000);
    assert.equal(est.rows[0]!.tax, 20_000_000 * RATE_LINEAL);
    assert.equal(est.rows[0]!.band, "lineal");
  });

  it("charges 10% for a sibling and nothing for a spouse", () => {
    const sib = emptyVault("เจ้าของ");
    heir(sib, "sibling", "พี่");
    land(sib, 150_000_000);
    const sibTax = estimateInheritanceTax(sib);
    assert.equal(sibTax.rows[0]!.tax, 50_000_000 * RATE_OTHER);

    const sp = emptyVault("เจ้าของ");
    heir(sp, "spouse", "คู่");
    land(sp, 200_000_000);
    const spTax = estimateInheritanceTax(sp);
    assert.equal(spTax.rows[0]!.tax, 0);
    assert.equal(spTax.rows[0]!.band, "exempt");
  });

  it("does not treat crypto as a taxable inheritance asset", () => {
    const vault = emptyVault("เจ้าของ");
    heir(vault, "friend", "เพื่อน");
    vault.assets.push({
      id: "btc",
      category: "crypto",
      name: "BTC",
      institution: "",
      identifier: "",
      valueThb: 200_000_000,
      location: "",
      notes: "",
      beneficiaryIds: ["h1"],
      secret: "",
      marital: "separate",
      updatedAt: new Date().toISOString(),
    });
    const est = estimateInheritanceTax(vault);
    assert.equal(est.rows[0]!.received, 0);
    assert.equal(est.rows[0]!.excluded, 200_000_000);
    assert.equal(est.totalTax, 0);
  });
});
