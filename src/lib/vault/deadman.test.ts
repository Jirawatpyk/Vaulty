import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isHttpsUrl, maskEmail, nextDueAt, sanitizeInterval, shouldFire, switchMessage } from "./deadman.ts";

describe("dead-man switch", () => {
  it("fires only when armed, due, and past cooldown", () => {
    const now = Date.parse("2026-09-14T05:00:00Z");
    assert.equal(shouldFire({ armed: false, dueAt: "2026-09-01T00:00:00Z", lastFired: null, now }), false);
    assert.equal(shouldFire({ armed: true, dueAt: "2026-09-14T06:00:00Z", lastFired: null, now }), false);
    assert.equal(shouldFire({ armed: true, dueAt: "2026-09-01T00:00:00Z", lastFired: null, now }), true);
    assert.equal(
      shouldFire({ armed: true, dueAt: "2026-09-01T00:00:00Z", lastFired: "2026-09-14T04:00:00Z", now }),
      false,
    );
    assert.equal(
      shouldFire({ armed: true, dueAt: "2026-09-01T00:00:00Z", lastFired: "2026-09-13T00:00:00Z", now }),
      true,
    );
  });

  it("never puts a passcode in the notice", () => {
    const text = switchMessage("สุทธิธิดา วรวัฒน์", "th");
    assert.match(text, /เลยกำหนดเช็คอิน/);
    assert.doesNotMatch(text, /258036/);
    assert.doesNotMatch(text, /รหัสผ่าน/);
    assert.equal(maskEmail("ariya@pongsailaw.co.th"), "a***@pongsailaw.co.th");
    assert.equal(isHttpsUrl("https://hooks.example.com/line"), true);
    assert.equal(isHttpsUrl("http://hooks.example.com/line"), false);
    assert.equal(sanitizeInterval(0), 1);
    assert.equal(sanitizeInterval(400), 365);
    const due = nextDueAt(Date.parse("2026-09-01T00:00:00Z"), 1);
    assert.equal(due.startsWith("2026-09-02"), true);
  });
});
