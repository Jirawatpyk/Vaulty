import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  PLANS,
  SELLER,
  documentHtml,
  effectiveFeatures,
  effectivePlan,
  emptySubscription,
  hasFeature,
  isThaiTaxId,
  nextDocNo,
  parseProfile,
  profileReadyForTaxInvoice,
  resolveStatus,
  splitVat,
  trialEligible,
  type BillingSubscription,
} from "./billing.ts";

describe("VAT split", () => {
  it("splits gross inclusive amounts so base + vat = gross", () => {
    for (const plan of Object.values(PLANS)) {
      const { base, vat, gross } = splitVat(plan.grossSatang);
      assert.equal(base + vat, gross);
      assert.equal(gross, plan.grossSatang);
    }
    const care = splitVat(199_000);
    assert.equal(care.gross, 199_000);
    assert.ok(care.vat > 0);
    assert.ok(Math.abs(care.vat / care.base - 0.07) < 0.001);
  });
});

describe("entitlements", () => {
  const trial: BillingSubscription = {
    ...emptySubscription(),
    planCode: "care",
    status: "trialing",
    trialStartedAt: new Date().toISOString(),
    trialEndsAt: new Date(Date.now() + 86400000).toISOString(),
  };
  const expiredTrial: BillingSubscription = {
    ...emptySubscription(),
    planCode: "care",
    status: "trialing",
    trialStartedAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    trialEndsAt: new Date(Date.now() - 86400000).toISOString(),
  };
  const active: BillingSubscription = {
    ...emptySubscription(),
    planCode: "estate",
    status: "active",
    startedAt: new Date().toISOString(),
    endsAt: new Date(Date.now() + 100 * 86400000).toISOString(),
  };
  const grace: BillingSubscription = {
    ...emptySubscription(),
    planCode: "care",
    status: "active",
    startedAt: new Date(Date.now() - 400 * 86400000).toISOString(),
    endsAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  };

  it("trial matches Care features", () => {
    assert.equal(resolveStatus(trial), "trialing");
    assert.equal(effectivePlan(trial), "care");
    assert.equal(hasFeature(trial, "cloud_write"), true);
    assert.equal(hasFeature(trial, "deadman_arm"), true);
    assert.equal(hasFeature(emptySubscription(), "cloud_write"), false);
  });

  it("expired trial has no paid features", () => {
    assert.equal(resolveStatus(expiredTrial), "none");
    assert.equal(hasFeature(expiredTrial, "cloud_write"), false);
    assert.equal(trialEligible(expiredTrial), false);
    assert.equal(trialEligible(emptySubscription()), true);
  });

  it("active Estate can write cloud; grace can only read", () => {
    assert.deepEqual(effectiveFeatures(active).sort(), PLANS.estate.features.slice().sort());
    assert.equal(resolveStatus(grace), "grace");
    assert.deepEqual(effectiveFeatures(grace), ["cloud_read"]);
    assert.equal(hasFeature(grace, "cloud_write"), false);
  });
});

describe("buyer profile", () => {
  it("accepts a 13-digit tax id and rejects short ones", () => {
    assert.equal(isThaiTaxId("1234567890123"), true);
    assert.equal(isThaiTaxId("123"), false);
    assert.equal(isThaiTaxId("abcdefghijklm"), false);
    const parsed = parseProfile({ legalName: "  บจก. ทดสอบ  ", taxId: "123-456-789-0123", extra: true });
    assert.equal(parsed.legalName, "บจก. ทดสอบ");
    assert.equal(parsed.taxId, "1234567890123");
    assert.equal(profileReadyForTaxInvoice(parsed), false);
    parsed.address = "Rayong";
    assert.equal(profileReadyForTaxInvoice(parsed), true);
  });
});

describe("documents", () => {
  it("increments document numbers inside the same month prefix", () => {
    const when = new Date(2026, 8, 14);
    assert.equal(nextDocNo("R", undefined, when), "VT-R-2609-00001");
    assert.equal(nextDocNo("R", "VT-R-2609-00001", when), "VT-R-2609-00002");
  });

  it("marks receipts as test documents and never includes a vault code", () => {
    const html = documentHtml({
      kind: "receipt",
      docNo: "VT-R-2609-00001",
      plan: "care",
      profile: { legalName: "ทดสอบ", address: "ระยอง", taxId: "1234567890123", branch: "", email: "" },
      createdAt: "2026-09-14T07:00:00.000Z",
      amounts: splitVat(199_000),
      lang: "th",
    });
    assert.match(html, /เอกสารทดสอบ/);
    assert.match(html, /ไม่มีการเก็บเงินจริง|ไม่ตัดบัตร/);
    assert.doesNotMatch(html, /258036/);
    assert.match(html, /ยังไม่จดทะเบียน/);
    assert.equal(SELLER.registered, false);
  });
});
