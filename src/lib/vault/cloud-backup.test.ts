import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { sealVault } from "./crypto.ts";
import { parseSealedPayload, cloudFingerprint, CLOUD_MAX_CHARS } from "./cloud-backup.ts";
import { createDemoVault, emptyVault } from "./seed.ts";

describe("cloud backup payload", () => {
  it("accepts a sealed blob and rejects plaintext vaults and PINs", async () => {
    const vault = createDemoVault("th");
    const blob = await sealVault(vault, "258036");
    const raw = JSON.stringify(blob);
    const ok = parseSealedPayload(raw);
    assert.equal(ok.ok, true);
    if (ok.ok) {
      assert.match(ok.normalized, /"v":1/);
      assert.doesNotMatch(ok.normalized, /258036/);
      assert.doesNotMatch(ok.normalized, /สุทธิดา/);
      const fp = await cloudFingerprint(ok.normalized);
      assert.equal(fp.length, 12);
      assert.equal(await cloudFingerprint(ok.normalized), fp);
    }

    const plain = JSON.stringify(emptyVault("ทดลอง", "th"));
    const rejected = parseSealedPayload(plain);
    assert.equal(rejected.ok, false);
    if (!rejected.ok) assert.equal(rejected.error, "plaintext");

    assert.equal(parseSealedPayload('{"pin":"258036"}').ok, false);
    assert.equal(parseSealedPayload("").ok, false);
    assert.equal(parseSealedPayload("{").ok, false);
    assert.equal(parseSealedPayload("x".repeat(CLOUD_MAX_CHARS + 1)).ok, false);
    assert.equal(parseSealedPayload(JSON.stringify({ v: 1, salt: "", iv: "a", data: "b" })).ok, false);
  });

  it("normalizes extra keys off a sealed blob", async () => {
    const blob = await sealVault(emptyVault("Ann"), "147258");
    const messy = JSON.stringify({ ...blob, note: "drop me" });
    const parsed = parseSealedPayload(messy);
    assert.equal(parsed.ok, true);
    if (parsed.ok) {
      assert.equal("note" in JSON.parse(parsed.normalized), false);
      assert.deepEqual(JSON.parse(parsed.normalized).v, 1);
    }
  });
});
