import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { extractEmail, isCheckInOverdue, overdueLineUrl, overdueMailto, overdueMessage, shouldBrowserNudge } from "./nudge.ts";
import { createDemoVault } from "./seed.ts";

describe("overdue LINE/mail nudge", () => {
  it("builds mailto and LINE links without the passcode", () => {
    const vault = createDemoVault("th");
    assert.equal(extractEmail(vault.access.executorContact), "ariya@pongsailaw.co.th");
    const mail = decodeURIComponent(overdueMailto(vault, "th"));
    assert.match(mail, /^mailto:ariya@pongsailaw\.co\.th\?/);
    assert.match(mail, /เลยกำหนด/);
    assert.doesNotMatch(mail, /258036/);
    const line = overdueLineUrl(vault, "th");
    assert.match(line, /^https:\/\/line\.me\/R\/msg\/text\/\?/);
    assert.match(decodeURIComponent(line), /อย่าใส่รหัส/);
    assert.doesNotMatch(overdueMessage(vault, "en"), /258036/);
  });

  it("treats a missed check-in as overdue", () => {
    const vault = createDemoVault("th");
    vault.access.checkInDays = 1;
    vault.access.lastCheckIn = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    assert.equal(isCheckInOverdue(vault), true);
    vault.access.checkInDays = 365;
    assert.equal(isCheckInOverdue(vault), false);
    assert.equal(shouldBrowserNudge(true, null), true);
    assert.equal(shouldBrowserNudge(true, Date.now()), false);
    assert.equal(shouldBrowserNudge(false, null), false);
  });
});
