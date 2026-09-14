import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { clientIp, createTickGuard, pickClientIp } from "./tick-guard.ts";

describe("tick rate limit", () => {
  it("rejects unauthorized without consuming the success budget", () => {
    const g = createTickGuard({ maxOk: 2, windowMs: 60_000, failMax: 5 });
    const denied = g.decide({ ip: "1.1.1.1", authorized: false, now: 1_000 });
    assert.equal(denied.ok, false);
    if (!denied.ok) assert.equal(denied.status, 401);
    const ok = g.decide({ ip: "1.1.1.1", authorized: true, now: 1_001 });
    assert.equal(ok.ok, true);
  });

  it("caps successful ticks even when the secret is valid", () => {
    const g = createTickGuard({ maxOk: 2, windowMs: 10_000 });
    const t0 = 50_000;
    assert.equal(g.decide({ ip: "10.0.0.1", authorized: true, now: t0 }).ok, true);
    assert.equal(g.decide({ ip: "10.0.0.1", authorized: true, now: t0 + 10 }).ok, true);
    const third = g.decide({ ip: "10.0.0.1", authorized: true, now: t0 + 20 });
    assert.equal(third.ok, false);
    if (!third.ok) {
      assert.equal(third.status, 429);
      assert.equal(third.error, "rate");
      assert.ok(third.retryAfterSec >= 1);
    }
    assert.equal(g.decide({ ip: "10.0.0.1", authorized: true, now: t0 + 10_001 }).ok, true);
  });

  it("locks an IP after repeated wrong secrets", () => {
    const g = createTickGuard({ failMax: 3, failWindowMs: 60_000, lockMs: 15_000 });
    const t0 = 1_000;
    assert.equal(g.decide({ ip: "8.8.8.8", authorized: false, now: t0 }).ok, false);
    assert.equal(g.decide({ ip: "8.8.8.8", authorized: false, now: t0 + 1 }).ok, false);
    const locked = g.decide({ ip: "8.8.8.8", authorized: false, now: t0 + 2 });
    assert.equal(locked.ok, false);
    if (!locked.ok) {
      assert.equal(locked.status, 429);
      assert.equal(locked.error, "locked");
    }
    const still = g.decide({ ip: "8.8.8.8", authorized: true, now: t0 + 3 });
    assert.equal(still.ok, false);
    if (!still.ok) assert.equal(still.error, "locked");
  });
});

describe("client IP", () => {
  it("takes the first forwarded hop and ignores header injection", () => {
    assert.equal(pickClientIp("203.0.113.9, 10.0.0.1", "10.0.0.1"), "203.0.113.9");
    assert.equal(pickClientIp("1.1.1.1\r\nX-Hack: 1", "10.0.0.1"), "10.0.0.1");
    assert.equal(pickClientIp("1.1.1.1\nX-Hack: 1", "also\nbad"), "unknown");
    const req = new Request("http://x.test/api/deadman/tick", {
      headers: { "x-forwarded-for": "203.0.113.9, 10.0.0.1", "x-real-ip": "10.0.0.1" },
    });
    assert.equal(clientIp(req), "203.0.113.9");
  });
});
