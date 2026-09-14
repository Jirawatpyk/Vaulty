import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { familyPackHtml, packContainsSecret } from "./family-pack.ts";
import { createDemoVault } from "./seed.ts";

describe("family pack", () => {
  it("includes the legal notice and omits secrets", () => {
    const vault = createDemoVault("th");
    const heir = vault.beneficiaries[0]!;
    const html = familyPackHtml(vault, heir, "th");
    assert.match(html, /ไม่ใช่พินัยกรรม|not a will/i);
    assert.equal(packContainsSecret(html, vault), false);
    assert.match(html, new RegExp(heir.name));
    assert.doesNotMatch(html, /seed เก็บแยกในซองคราฟต์/);
  });
});
