import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { packContainsSecret } from "./family-pack.ts";
import { lawyerBriefGaps, lawyerBriefHtml } from "./lawyer-brief.ts";
import { createDemoVault, emptyVault } from "./seed.ts";

describe("lawyer brief", () => {
  it("says it is not a will and omits secrets", () => {
    const vault = createDemoVault("th");
    const html = lawyerBriefHtml(vault, "th");
    assert.match(html, /นี่ไม่ใช่พินัยกรรม/);
    assert.match(html, /ไม่โอน/);
    assert.match(html, /พยานอย่างน้อยสองคน/);
    assert.match(html, /สินสมรส/);
    assert.match(html, /ส่วนคู่สมรสก่อนแบ่ง/);
    assert.match(html, /ไม่ใช่คำปรึกษาทางกฎหมาย/);
    assert.match(html, new RegExp(vault.profile.fullName));
    assert.match(html, /ลายมือชื่อเจ้าของคลัง/);
    assert.equal(packContainsSecret(html, vault), false);
    assert.doesNotMatch(html, /YubiKey/);
    assert.doesNotMatch(html, /seed เก็บแยก/);
  });

  it("english pack is not a will either", () => {
    const vault = createDemoVault("en");
    const html = lawyerBriefHtml(vault, "en");
    assert.match(html, /This is not a will/i);
    assert.match(html, /Vault owner signature/);
    assert.equal(packContainsSecret(html, vault), false);
  });

  it("lists gaps on an empty vault", () => {
    const vault = emptyVault("ทดลอง", "th");
    const gaps = lawyerBriefGaps(vault);
    assert.ok(gaps.includes("taskAsset"));
    assert.ok(gaps.includes("taskHeir"));
    assert.ok(gaps.includes("taskExecutor"));
    assert.ok(gaps.includes("gapDob"));
    const html = lawyerBriefHtml(vault, "th");
    assert.match(html, /ยังไม่มีวันเกิด/);
  });
});
