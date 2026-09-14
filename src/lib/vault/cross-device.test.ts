import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { sealVault } from "./crypto.ts";
import { canRestore } from "./recover.ts";
import { crossDeviceGuideHtml, formatFingerprint, sealedFingerprint } from "./cross-device.ts";
import { createDemoVault } from "./seed.ts";

describe("cross-device sealed backup", () => {
  it("fingerprints a sealed blob and the guide omits the pin", async () => {
    const vault = createDemoVault("th");
    const blob = await sealVault(vault, "258036");
    const raw = JSON.stringify(blob);
    assert.equal(canRestore(raw), true);
    const fp = await sealedFingerprint(raw);
    assert.equal(fp.length, 12);
    assert.equal(await sealedFingerprint(raw), fp);
    assert.match(formatFingerprint(fp), /[0-9a-f]{4} [0-9a-f]{4} [0-9a-f]{4}/i);
    const html = crossDeviceGuideHtml("th", fp, vault.profile.fullName);
    assert.match(html, /กู้คลังข้ามเครื่อง/);
    assert.match(html, /vaulty-sealed/);
    assert.doesNotMatch(html, /258036/);
    assert.match(html, new RegExp(vault.profile.fullName));
  });
});
