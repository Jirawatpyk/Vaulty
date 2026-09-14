import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  PLANS,
  SELLER,
  activationNoop,
  formatDocNo,
  documentHtml,
  docSeriesPrefix,
  effectiveFeatures,
  effectivePlan,
  emptySubscription,
  hasFeature,
  isPlanCode,
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
    assert.equal(isThaiTaxId(""), false);
    assert.equal(isThaiTaxId("123456789012"), false);
    assert.equal(isThaiTaxId(" 1234567890123 "), true);
    const parsed = parseProfile({ legalName: "  บจก. ทดสอบ  ", taxId: "123-456-789-0123", extra: true });
    assert.equal(parsed.legalName, "บจก. ทดสอบ");
    assert.equal(parsed.taxId, "1234567890123");
    assert.equal(profileReadyForTaxInvoice(parsed), false);
    parsed.address = "Rayong";
    assert.equal(profileReadyForTaxInvoice(parsed), true);
  });

  it("strips control characters, truncates, and ignores junk payloads", () => {
    const parsed = parseProfile({
      legalName: "A".repeat(200) + "\r\nBcc: evil@x.com",
      address: "<script>alert(1)</script>",
      taxId: "99999999999999999",
      branch: ["array"],
      email: "  name@example.com \n",
    });
    assert.equal(parsed.legalName.length, 120);
    assert.doesNotMatch(parsed.legalName, /\n/);
    assert.equal(parsed.taxId.length, 13);
    assert.equal(parsed.address, "<script>alert(1)</script>");
    assert.equal(parsed.email, "name@example.com");
    assert.equal(parseProfile(null).legalName, "");
    assert.equal(parseProfile(["x"]).legalName, "");
    assert.equal(profileReadyForTaxInvoice(emptyish()), false);
  });
});

function emptyish() {
  return parseProfile({});
}

describe("documents", () => {
  it("increments document numbers inside the same month prefix", () => {
    const when = new Date(2026, 8, 14);
    assert.equal(nextDocNo("R", undefined, when), "VT-R-2609-00001");
    assert.equal(nextDocNo("R", "VT-R-2609-00001", when), "VT-R-2609-00002");
    assert.equal(nextDocNo("R", "VT-R-2608-00099", when), "VT-R-2609-00001");
    assert.equal(nextDocNo("T", "not-a-number", when), "VT-T-2609-00001");
  });

  it("two readers of the same last number collide; sequence serials do not", () => {
    const when = new Date(2026, 8, 14);
    const last = "VT-R-2609-00007";
    assert.equal(nextDocNo("R", last, when), nextDocNo("R", last, when));
    assert.notEqual(formatDocNo("R", 8, when), formatDocNo("R", 9, when));
    assert.equal(formatDocNo("R", 8, when), "VT-R-2609-00008");
    assert.equal(docSeriesPrefix("T", when), "VT-T-2609-");
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

  it("escapes buyer HTML so a name cannot run as a script", () => {
    const html = documentHtml({
      kind: "receipt",
      docNo: "VT-R-2609-00009",
      plan: "care",
      profile: {
        legalName: `<img src=x onerror=alert(1)>`,
        address: `<script>alert(2)</script>`,
        taxId: "1234567890123",
        branch: `" onclick="`,
        email: "a@b.c",
      },
      createdAt: "2026-09-14T07:00:00.000Z",
      amounts: splitVat(199_000),
      lang: "th",
    });
    assert.doesNotMatch(html, /<script>/i);
    assert.doesNotMatch(html, /<img\s/i);
    assert.ok(html.includes("&" + "lt;img"));
    assert.ok(html.includes("&" + "lt;script" + "&" + "gt;"));
  });
});

describe("status edges", () => {
  const base = emptySubscription();

  it("paused and revoked never keep paid features", () => {
    const paused: BillingSubscription = { ...base, planCode: "estate", status: "paused" };
    const revoked: BillingSubscription = { ...base, planCode: "counsel", status: "revoked" };
    assert.equal(resolveStatus(paused), "paused");
    assert.equal(effectivePlan(paused), "free");
    assert.equal(hasFeature(paused, "cloud_write"), false);
    assert.equal(hasFeature(revoked, "tax_invoice"), false);
    assert.equal(trialEligible(paused), false);
  });

  it("past_due still has features; after grace they drop", () => {
    const now = Date.parse("2026-09-14T00:00:00.000Z");
    const pastDue: BillingSubscription = {
      ...base,
      planCode: "care",
      status: "active",
      endsAt: "2026-09-10T00:00:00.000Z",
    };
    const afterGrace: BillingSubscription = {
      ...base,
      planCode: "care",
      status: "active",
      endsAt: "2026-07-01T00:00:00.000Z",
    };
    const badDate: BillingSubscription = { ...base, planCode: "care", status: "active", endsAt: "not-a-date" };
    assert.equal(resolveStatus(pastDue, now), "past_due");
    assert.equal(hasFeature(pastDue, "cloud_write", now), true);
    assert.equal(resolveStatus(afterGrace, now), "none");
    assert.equal(hasFeature(afterGrace, "cloud_read", now), false);
    assert.equal(resolveStatus(badDate, now), "none");
  });

  it("does not mint another document pair for the same active plan", () => {
    const active: BillingSubscription = {
      ...base,
      planCode: "care",
      status: "active",
      endsAt: "2027-09-14T00:00:00.000Z",
    };
    assert.equal(activationNoop(active, "care"), true);
    assert.equal(activationNoop(active, "estate"), false);
    assert.equal(activationNoop(emptySubscription(), "care"), false);
    assert.equal(isPlanCode("free"), true);
    assert.equal(isPlanCode("gold"), false);
  });
});
