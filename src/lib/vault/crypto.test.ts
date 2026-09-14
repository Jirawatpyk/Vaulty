import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  BLOB_VERSION,
  PBKDF2_ITERATIONS,
  PBKDF2_ITERATIONS_V1,
  isEncryptedBlob,
  iterationsFor,
  openVault,
  resealVault,
  sealVault,
} from "./crypto.ts";

describe("PBKDF2 versioning", () => {
  it("seals new vaults at 600k iterations (v2)", async () => {
    assert.equal(BLOB_VERSION, 2);
    assert.equal(PBKDF2_ITERATIONS, 600_000);
    assert.equal(iterationsFor(1), PBKDF2_ITERATIONS_V1);
    assert.equal(iterationsFor(2), PBKDF2_ITERATIONS);
    const blob = await sealVault({ ok: true }, "258036");
    assert.equal(blob.v, 2);
    assert.equal(isEncryptedBlob(blob), true);
    const opened = await openVault<{ ok: boolean }>(blob, "258036");
    assert.equal(opened.data.ok, true);
    await assert.rejects(() => openVault(blob, "000000"));
  });

  it("still opens a v1 blob sealed at 100k rounds", async () => {
    const legacy = await sealVault({ name: "สุทธิดา" }, "147258", 1);
    assert.equal(legacy.v, 1);
    const opened = await openVault<{ name: string }>(legacy, "147258");
    assert.equal(opened.data.name, "สุทธิดา");
    const bumped = { ...legacy, v: 2 as const };
    await assert.rejects(() => openVault(bumped, "147258"));
  });

  it("reseals with the same version so the derived key still matches", async () => {
    const pin = "258036";
    const v1 = await sealVault({ n: 1 }, pin, 1);
    const opened = await openVault<{ n: number }>(v1, pin);
    const again = await resealVault({ n: 2 }, opened.key, v1.salt, 1);
    assert.equal(again.v, 1);
    const reread = await openVault<{ n: number }>(again, pin);
    assert.equal(reread.data.n, 2);
  });
});
