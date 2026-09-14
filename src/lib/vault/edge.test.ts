import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { coerceVault, clamp } from "./coerce.ts";
import { completenessScore, heirValue, totalValue } from "./completeness.ts";
import { isEncryptedBlob } from "./crypto.ts";
import { formatDate, formatThb, relativeTime } from "./format.ts";
import { backoffMs, nextLockout, remainingMs } from "./lockout.ts";
import { emptyVault } from "./seed.ts";

describe("clamp / coerce", () => {
  it("clamps NaN and out-of-range", () => {
    assert.equal(clamp(Number.NaN, 0, 10), 0);
    assert.equal(clamp(-5, 0, 100), 0);
    assert.equal(clamp(999, 0, 100), 100);
  });

  it("rejects non-objects and nameless profiles", () => {
    assert.equal(coerceVault(null), null);
    assert.equal(coerceVault("vault"), null);
    assert.equal(coerceVault({ profile: { fullName: "  " }, assets: [] }), null);
  });

  it("drops broken items and clamps money/shares", () => {
    const vault = coerceVault({
      profile: { fullName: "Ann" },
      assets: [
        { id: "a1", name: "Home", valueThb: -20, category: "nope", beneficiaryIds: ["x"] },
        { name: "missing id", valueThb: 1 },
        null,
      ],
      beneficiaries: [{ id: "h1", name: "Kid", sharePercent: 250, relationship: "alien" }],
      letters: [{ id: "l1", body: "  " }, { id: "l2", body: "Hello" }],
      documents: [{ id: "d1" }, { id: "d2", title: "Will", kind: "will" }],
    });
    assert.ok(vault);
    assert.equal(vault.assets.length, 1);
    assert.equal(vault.assets[0]!.valueThb, 0);
    assert.equal(vault.assets[0]!.category, "other");
    assert.equal(vault.beneficiaries[0]!.sharePercent, 100);
    assert.equal(vault.beneficiaries[0]!.relationship, "other");
    assert.equal(vault.letters.length, 1);
    assert.equal(vault.documents.length, 1);
  });
});

describe("encrypted blob guard", () => {
  it("rejects incomplete or empty payloads", () => {
    assert.equal(isEncryptedBlob(null), false);
    assert.equal(isEncryptedBlob({ v: 1 }), false);
    assert.equal(isEncryptedBlob({ v: 1, salt: "", iv: "a", data: "b" }), false);
    assert.equal(isEncryptedBlob({ v: 2, salt: "a", iv: "b", data: "c" }), false);
    assert.equal(isEncryptedBlob({ v: 1, salt: "a", iv: "b", data: "c" }), true);
  });
});

describe("empty vault completeness", () => {
  it("scores a new vault as incomplete and values at zero", () => {
    const vault = emptyVault("Tester");
    assert.ok(completenessScore(vault) < 40);
    assert.equal(totalValue(vault), 0);
    assert.equal(heirValue(vault, "missing"), 0);
  });
});

describe("format edge dates", () => {
  it("returns em dash for blank or invalid dates", () => {
    assert.equal(formatDate("", "en"), "—");
    assert.equal(formatDate("not-a-date", "en"), "not-a-date");
    assert.equal(relativeTime("bogus", "th"), "—");
    assert.equal(formatThb(0, "th").includes("0"), true);
  });
});

describe("lockout remaining", () => {
  it("stays unlocked until the 5th fail then cools down", () => {
    let state = { fails: 0, until: 0 };
    for (let i = 0; i < 4; i++) state = nextLockout(state, 0);
    assert.equal(backoffMs(state.fails), 0);
    state = nextLockout(state, 1_000);
    assert.equal(state.fails, 5);
    assert.ok(remainingMs(state, 1_000) > 0);
  });
});
