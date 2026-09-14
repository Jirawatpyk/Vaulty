import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { coerceVault } from "./coerce.ts";
import { isEncryptedBlob, openVault, sealVault } from "./crypto.ts";
import {
  canRestore,
  classifySealed,
  parseLockout,
  parseSecEvents,
  recoverAutoLock,
  shouldCommitPersist,
} from "./recover.ts";
import { emptyVault } from "./seed.ts";

describe("blob recovery", () => {
  it("classifies empty, sealed, and corrupt payloads", async () => {
    assert.equal(classifySealed(null), "empty");
    assert.equal(classifySealed(""), "empty");
    assert.equal(classifySealed("{"), "corrupt");
    assert.equal(classifySealed('{"v":1}'), "corrupt");
    assert.equal(classifySealed("[]"), "corrupt");
    const blob = await sealVault(emptyVault("Ann"), "147258");
    const raw = JSON.stringify(blob);
    assert.equal(classifySealed(raw), "sealed");
    assert.equal(canRestore(raw), true);
    assert.equal(canRestore("{"), false);
    assert.equal(canRestore(""), false);
  });

  it("round-trips export then restore after a wipe-equivalent", async () => {
    const vault = emptyVault("Recovery");
    vault.assets.push({
      id: "keep",
      category: "banking",
      name: "Must survive",
      institution: "KBANK",
      identifier: "1",
      valueThb: 9_000,
      location: "",
      notes: "",
      beneficiaryIds: [],
      secret: "pin-9",
      marital: "unknown" as const,
      updatedAt: new Date().toISOString(),
    });
    const pin = "369258";
    const exported = JSON.stringify(await sealVault(vault, pin));
    assert.equal(canRestore(exported), true);
    const restored = await openVault<typeof vault>(JSON.parse(exported), pin);
    const coerced = coerceVault(restored.data);
    assert.equal(coerced?.assets[0]?.name, "Must survive");
    assert.equal(coerced?.assets[0]?.secret, "pin-9");
  });

  it("recovers a half-written vault object instead of crashing", () => {
    const vault = coerceVault({
      profile: { fullName: "Live" },
      assets: [null, { id: "ok", name: "House", valueThb: "x" }],
      activity: "nope",
    });
    assert.ok(vault);
    assert.equal(vault.profile.fullName, "Live");
    assert.equal(vault.assets.length, 1);
    assert.deepEqual(vault.activity, []);
  });
});

describe("metadata recovery", () => {
  it("treats garbage lockout and audit logs as a clean slate", () => {
    assert.deepEqual(parseLockout(null), { fails: 0, until: 0 });
    assert.deepEqual(parseLockout("{"), { fails: 0, until: 0 });
    assert.deepEqual(parseLockout("[]"), { fails: 0, until: 0 });
    assert.deepEqual(parseLockout('{"fails":"nope","until":-9}'), { fails: 0, until: 0 });
    assert.equal(parseLockout('{"fails":99,"until":1}').fails, 50);
    assert.deepEqual(parseSecEvents(null), []);
    assert.deepEqual(parseSecEvents("{"), []);
    assert.deepEqual(parseSecEvents('{"kind":"unlock"}'), []);
    assert.equal(parseSecEvents('[{"at":"t","kind":"unlock"},{"at":"t","kind":"hack"}]').length, 1);
  });

  it("recovers auto-lock minutes from junk", () => {
    assert.equal(recoverAutoLock(null), 5);
    assert.equal(recoverAutoLock("nope"), 5);
    assert.equal(recoverAutoLock("0"), 5);
    assert.equal(recoverAutoLock("999"), 30);
    assert.equal(recoverAutoLock("8.2"), 8);
  });
});

describe("persist recovery", () => {
  it("drops stale writes after lock or a newer patch", () => {
    assert.equal(shouldCommitPersist(4, 5, true), false);
    assert.equal(shouldCommitPersist(5, 5, false), false);
    assert.equal(shouldCommitPersist(5, 5, true), true);
  });

  it("rejects a tampered export so restore cannot poison the vault", async () => {
    const blob = await sealVault(emptyVault("Ann"), "147258");
    const bad = { ...blob, data: `${blob.data}aa` };
    assert.equal(isEncryptedBlob(bad), true);
    await assert.rejects(() => openVault(bad, "147258"));
    assert.equal(canRestore(JSON.stringify({ v: 2, salt: "a", iv: "b", data: "c" })), false);
  });
});
