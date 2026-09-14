import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { coerceVault } from "./coerce.ts";
import { isEncryptedBlob, openVault, sealVault } from "./crypto.ts";
import { nextLockout } from "./lockout.ts";
import { emptyVault } from "./seed.ts";
import { tooLarge } from "./storage.ts";

describe("crypto durability", () => {
  it("round-trips unicode secrets and rejects a tampered blob", async () => {
    const vault = emptyVault("สุทธิดา วรวัฒน์ 🔐");
    vault.assets.push({
      id: "a1",
      category: "crypto",
      name: "<script>alert(1)</script>",
      institution: "Binance",
      identifier: "bc1q-test",
      valueThb: 1_000_000,
      location: "กรุงเทพฯ",
      notes: "คำว่า ' & \" และ \n บรรทัดใหม่",
      beneficiaryIds: [],
      secret: "มนต์กุญแจ-ยังไม่เผย",
      marital: "unknown" as const,
      updatedAt: new Date().toISOString(),
    });
    const pin = "258036";
    const blob = await sealVault(vault, pin);
    assert.equal(isEncryptedBlob(blob), true);

    const opened = await openVault<typeof vault>(blob, pin);
    const coerced = coerceVault(opened.data);
    assert.ok(coerced);
    assert.equal(coerced.profile.fullName, "สุทธิดา วรวัฒน์ 🔐");
    assert.equal(coerced.assets[0]!.name, "<script>alert(1)</script>");
    assert.equal(coerced.assets[0]!.secret, "มนต์กุญแจ-ยังไม่เผย");

    await assert.rejects(() => openVault(blob, "000000"));

    const tampered = { ...blob, data: blob.data.slice(0, -2) + (blob.data.endsWith("AA") ? "BB" : "AA") };
    await assert.rejects(() => openVault(tampered, pin));
  });

  it("seals a large estate and still opens it", async () => {
    const vault = emptyVault("Load Test");
    vault.assets = Array.from({ length: 120 }, (_, i) => ({
      id: `a${i}`,
      category: "other" as const,
      name: `Asset ${i} — ${"ก".repeat(20)}`,
      institution: "Bank",
      identifier: `ID-${i}`,
      valueThb: i * 1000,
      location: "BKK",
      notes: "n".repeat(200),
      beneficiaryIds: [],
      secret: `s-${i}`,
      marital: "unknown" as const,
      updatedAt: new Date().toISOString(),
    }));
    const blob = await sealVault(vault, "112233");
    const opened = await openVault<typeof vault>(blob, "112233");
    const coerced = coerceVault(opened.data);
    assert.equal(coerced?.assets.length, 120);
    assert.equal(coerced?.assets[119]!.valueThb, 119_000);
  });
});

describe("payload durability", () => {
  it("drops junk, prototype keys, and keeps a usable vault", () => {
    const polluted = JSON.parse(`{"profile":{"fullName":"Ann"},"assets":[{"id":"1","name":"Home","__proto__":{"hacked":true}}],"beneficiaries":null}`);
    const vault = coerceVault(polluted);
    assert.ok(vault);
    assert.equal(vault.assets.length, 1);
    assert.equal(Object.prototype.hasOwnProperty.call(vault.assets[0], "hacked"), false);
    assert.deepEqual(vault.beneficiaries, []);
  });

  it("rejects oversized or incomplete import payloads", () => {
    assert.equal(isEncryptedBlob({ v: 1, salt: "x", iv: "y", data: "z" }), true);
    assert.equal(isEncryptedBlob({ v: 1, salt: "x", iv: "y", data: "" }), false);
    const huge = "x".repeat(1_500_001);
    assert.equal(tooLarge(huge), true);
    assert.equal(tooLarge("ok"), false);
  });
});

describe("lockout burst", () => {
  it("stays consistent across a rapid fail storm", () => {
    let state = { fails: 0, until: 0 };
    for (let i = 0; i < 12; i++) state = nextLockout(state, i * 10);
    assert.equal(state.fails, 12);
    assert.ok(state.until > 0);
  });
});
