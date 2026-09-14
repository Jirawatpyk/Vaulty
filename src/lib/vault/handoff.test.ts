import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { sealVault } from "./crypto.ts";
import { attestationHtml, checkInIcs, keyCardHtml } from "./handoff.ts";
import { evaluateHealth } from "./health.ts";
import { executorPortalHtml, portalContainsPlainSecret } from "./portal.ts";
import { redactVault } from "./redact.ts";
import { createDemoVault } from "./seed.ts";

describe("product handoff", () => {
  it("builds a check-in calendar, key card, and attestation without leaking secrets", () => {
    const vault = createDemoVault("th");
    const ics = checkInIcs(vault, "th");
    assert.match(ics, /BEGIN:VCALENDAR/);
    assert.match(ics, /RRULE:FREQ=DAILY/);
    const card = keyCardHtml(vault, "th");
    assert.match(card, /ไม่ใช่พินัยกรรม|not a will/i);
    assert.doesNotMatch(card, /258036/);
    const secret = vault.assets.find((a) => a.secret)?.secret ?? "";
    assert.ok(secret);
    assert.equal(card.includes(secret), false);
    const report = evaluateHealth({ blobRaw: null, lockoutUntil: 0, failedAttempts: 0, lastUnlock: null });
    const att = attestationHtml(report, "th");
    assert.match(att, /AES-GCM|PBKDF2|รายงาน/);
  });

  it("seals an executor portal that hides secrets until decrypt", async () => {
    const vault = createDemoVault("th");
    const secret = vault.assets.find((a) => a.secret)?.secret ?? "";
    const blob = await sealVault(vault, "258036");
    const html = executorPortalHtml(blob, vault.profile.fullName, "th");
    assert.equal(portalContainsPlainSecret(html, secret), false);
    assert.match(html, /PBKDF2/);
    assert.match(html, /100000/);
    const redacted = redactVault(vault);
    assert.equal(redacted.assets.every((a) => !a.secret), true);
    assert.ok(vault.assets.some((a) => a.secret));
  });
});
