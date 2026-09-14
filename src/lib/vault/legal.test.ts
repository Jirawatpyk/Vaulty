import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  LEGAL_VERSION,
  emptyConsent,
  grantConsent,
  isConsentLive,
  legalDoc,
  legalHasNamedController,
  legalHasPdpaRights,
  parseConsent,
  withdrawConsent,
} from "./legal.ts";

describe("PDPA consent", () => {
  it("rejects junk, old versions, and withdrawn grants", () => {
    assert.equal(isConsentLive(emptyConsent(), "account"), false);
    assert.equal(isConsentLive(parseConsent(null), "cloud"), false);
    assert.equal(isConsentLive(parseConsent({ version: "0", terms: true, privacy: true, account: true }), "account"), false);
    const live = grantConsent(emptyConsent(), { terms: true, privacy: true, account: true });
    assert.equal(live.version, LEGAL_VERSION);
    assert.equal(isConsentLive(live, "account"), true);
    assert.equal(isConsentLive(live, "cloud"), false);
    assert.equal(isConsentLive(live, "notify"), false);
    const withCloud = grantConsent(live, { cloud: true });
    assert.equal(isConsentLive(withCloud, "cloud"), true);
    assert.equal(isConsentLive(withCloud, "notify"), false);
    const gone = withdrawConsent(withCloud);
    assert.equal(isConsentLive(gone, "account"), false);
    assert.equal(isConsentLive(gone, "cloud"), false);
    assert.ok(gone.withdrawnAt);
  });

  it("does not keep cloud grant if terms or account missing", () => {
    const denied = grantConsent(emptyConsent(), { cloud: true, notify: true });
    assert.equal(isConsentLive(denied, "cloud"), false);
    assert.equal(denied.account, false);
  });

  it("parses extra keys without treating strings as true", () => {
    const parsed = parseConsent({ version: LEGAL_VERSION, terms: "yes", privacy: true, account: 1, cloud: true });
    assert.equal(parsed.terms, false);
    assert.equal(parsed.privacy, true);
    assert.equal(parsed.account, false);
    assert.equal(parsed.cloud, true);
  });
});

describe("legal documents", () => {
  it("terms and privacy exist in Thai and English with PDPA rights", () => {
    for (const lang of ["th", "en"] as const) {
      const terms = legalDoc("terms", lang);
      const privacy = legalDoc("privacy", lang);
      assert.ok(terms.sections.length >= 10);
      assert.ok(privacy.sections.length >= 10);
      assert.equal(legalHasPdpaRights(privacy), true);
      assert.equal(legalHasNamedController(privacy), true);
      const blob = `${terms.title} ${terms.sections.map((s) => s.paragraphs.join(" ")).join(" ")}`;
      assert.match(blob, /ไม่ใช่พินัยกรรม|not a will/i);
      assert.match(blob, /20/);
      assert.match(blob, /โหมดทดสอบ|test mode/i);
      const p = privacy.sections.map((s) => s.paragraphs.join(" ")).join(" ");
      assert.match(p, /สำนักงานคณะกรรมการคุ้มครองข้อมูลส่วนบุคคล|Personal Data Protection Commission/i);
      assert.match(p, /pdpc\.or\.th/);
      assert.match(p, /Resend|เมล/);
      assert.match(p, /ยังไม่จดทะเบียน|not yet incorporated/i);
    }
  });
});
