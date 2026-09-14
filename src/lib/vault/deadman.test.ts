import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  bearerMatches,
  isHttpsUrl,
  isSafeWebhookUrl,
  isPrivateIpv4,
  isPrivateAddress,
  mapInBatches,
  maskEmail,
  nextDueAt,
  sanitizeInterval,
  sanitizeNoticeLabel,
  shouldFire,
  switchMessage,
} from "./deadman.ts";

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

describe("webhook SSRF guard", () => {
  it("allows public HTTPS and rejects localhost, private IPs, and credentials", () => {
    assert.equal(isSafeWebhookUrl("https://hooks.example.com/line"), true);
    assert.equal(isSafeWebhookUrl("https://discord.com/api/webhooks/1/abc"), true);
    assert.equal(isSafeWebhookUrl("http://hooks.example.com/line"), false);
    assert.equal(isSafeWebhookUrl("https://localhost/hook"), false);
    assert.equal(isSafeWebhookUrl("https://127.0.0.1/hook"), false);
    assert.equal(isSafeWebhookUrl("https://[::1]/hook"), false);
    assert.equal(isSafeWebhookUrl("https://10.0.0.4/hook"), false);
    assert.equal(isSafeWebhookUrl("https://192.168.1.10/hook"), false);
    assert.equal(isSafeWebhookUrl("https://172.16.1.1/hook"), false);
    assert.equal(isSafeWebhookUrl("https://169.254.169.254/latest/meta-data"), false);
    assert.equal(isSafeWebhookUrl("https://metadata.google.internal/"), false);
    assert.equal(isSafeWebhookUrl("https://user:pass@hooks.example.com/x"), false);
    assert.equal(isSafeWebhookUrl("https://2130706433/"), false);
    assert.equal(isPrivateIpv4("127.0.0.1"), true);
    assert.equal(isPrivateIpv4("8.8.8.8"), false);
    assert.equal(isPrivateAddress("::1"), true);
    assert.equal(isPrivateAddress("fe80::1"), true);
    assert.equal(isPrivateAddress("::ffff:127.0.0.1"), true);
  });
});

describe("cron bearer compare", () => {
  it("is fail-closed and rejects a wrong secret", () => {
    assert.equal(bearerMatches("Bearer secret", "secret"), true);
    assert.equal(bearerMatches("Bearer nope", "secret"), false);
    assert.equal(bearerMatches("secret", "secret"), false);
    assert.equal(bearerMatches("Bearer secret", undefined), false);
    assert.equal(bearerMatches(null, "secret"), false);
    assert.equal(bearerMatches("Bearer secret", ""), false);
  });
});

describe("notice label", () => {
  it("strips CR/LF so a label cannot split mail headers", () => {
    assert.equal(sanitizeNoticeLabel("Ann\r\nBcc: evil@x.com"), "Ann Bcc: evil@x.com");
    assert.equal(sanitizeNoticeLabel("  สุทธิดา  "), "สุทธิดา");
  });
});

describe("batched parallel fire", () => {
  it("runs a chunk in parallel and continues after a rejection", async () => {
    let inflight = 0;
    let max = 0;
    const results = await mapInBatches(
      [1, 2, 3, 4, 5],
      async (n) => {
        inflight += 1;
        max = Math.max(max, inflight);
        await new Promise((r) => setTimeout(r, 20));
        inflight -= 1;
        if (n === 3) throw new Error("boom");
        return n * 2;
      },
      2,
    );
    assert.equal(results.length, 5);
    assert.ok(max <= 2);
    assert.ok(max >= 2);
    assert.equal(results[2]?.status, "rejected");
    assert.equal(results[0]?.status, "fulfilled");
    assert.equal(results[4]?.status, "fulfilled");
  });
});
