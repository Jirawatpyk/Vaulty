import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { coerceVault } from "./coerce.ts";
import { completenessScore, vaultTasks } from "./completeness.ts";
import { familyPackHtml } from "./family-pack.ts";
import { lawyerBriefGaps, lawyerBriefHtml } from "./lawyer-brief.ts";
import { createDemoVault, emptyVault } from "./seed.ts";
import {
  coerceWillCustody,
  custodyPlainText,
  custodyStatus,
  emptyWillCustody,
  isOffsiteCustody,
} from "./will-custody.ts";

describe("will custody", () => {
  it("treats empty and home as not off-site", () => {
    assert.equal(isOffsiteCustody(emptyWillCustody()), false);
    assert.equal(custodyStatus(emptyWillCustody()), "none");
    assert.equal(
      isOffsiteCustody({ ...emptyWillCustody(), place: "home", holderName: "ตู้เซฟชั้นสอง" }),
      false,
    );
    assert.equal(custodyStatus({ ...emptyWillCustody(), place: "home" }), "home");
  });

  it("requires a named holder for lawyer, bank, trusted, other", () => {
    assert.equal(isOffsiteCustody({ ...emptyWillCustody(), place: "lawyer" }), false);
    assert.equal(
      isOffsiteCustody({ ...emptyWillCustody(), place: "lawyer", holderName: "สำนักงานกฎหมายพงศ์ไพศาล" }),
      true,
    );
    assert.equal(
      isOffsiteCustody({ ...emptyWillCustody(), place: "bank", holderName: "กสิกรไทย สาขาสยาม" }),
      true,
    );
    assert.equal(isOffsiteCustody({ ...emptyWillCustody(), place: "trusted", holderName: "A" }), false);
  });

  it("coerces missing and junk fields", () => {
    assert.equal(coerceWillCustody(null).place, "none");
    assert.equal(coerceWillCustody({ place: "garage" }).place, "none");
    const ok = coerceWillCustody({
      place: "lawyer",
      holderName: "x".repeat(200),
      depositedAt: "2025-02-12",
    });
    assert.equal(ok.place, "lawyer");
    assert.equal(ok.holderName.length, 120);
    assert.equal(ok.depositedAt, "2025-02-12");
  });

  it("round-trips through coerceVault on old blobs without the field", () => {
    const vault = emptyVault("ทดลอง", "th");
    const raw = JSON.parse(JSON.stringify(vault)) as Record<string, unknown>;
    delete raw.willCustody;
    const next = coerceVault(raw);
    assert.ok(next);
    assert.equal(next.willCustody.place, "none");
  });

  it("demo vault is off-site at the lawyer", () => {
    const vault = createDemoVault("th");
    assert.equal(isOffsiteCustody(vault.willCustody), true);
    assert.equal(custodyStatus(vault.willCustody), "offsite");
    const task = vaultTasks(vault).find((x) => x.key === "taskWillCustody");
    assert.ok(task?.done);
    assert.match(custodyPlainText(vault.willCustody, "th"), /สำนักงานทนายความ/);
    assert.match(custodyPlainText(vault.willCustody, "th"), /พงศ์ไพศาล/);
  });

  it("empty vault is incomplete until off-site holder is named", () => {
    const vault = emptyVault("ทดลอง", "th");
    assert.equal(vaultTasks(vault).find((x) => x.key === "taskWillCustody")?.done, false);
    assert.ok(lawyerBriefGaps(vault).includes("taskWillCustody"));
    vault.willCustody = { ...emptyWillCustody(), place: "trusted", holderName: "นภา ศรีสุข เชียงใหม่" };
    assert.equal(vaultTasks(vault).find((x) => x.key === "taskWillCustody")?.done, true);
    assert.equal(lawyerBriefGaps(vault).includes("taskWillCustody"), false);
    assert.ok(completenessScore(vault) < 100);
  });

  it("lawyer brief and family pack name the holder and stay honest", () => {
    const vault = createDemoVault("th");
    const html = lawyerBriefHtml(vault, "th");
    assert.match(html, /ต้นฉบับพินัยกรรมนอกบ้าน/);
    assert.match(html, /สำนักงานกฎหมายพงศ์ไพศาล/);
    assert.match(html, /PP-WILL-2568-12/);
    assert.match(html, /Vaulty ไม่รับฝากต้นฉบับ/);
    assert.match(html, /นี่ไม่ใช่พินัยกรรม/);
    const heir = vault.beneficiaries[0]!;
    const pack = familyPackHtml(vault, heir, "th");
    assert.match(pack, /สินธร/);
    vault.willCustody = { ...emptyWillCustody(), place: "home", holderName: "ตู้เซฟบ้าน" };
    const home = lawyerBriefHtml(vault, "th");
    assert.match(home, /เสี่ยงไฟไหม้/);
    assert.ok(lawyerBriefGaps(vault).includes("taskWillCustody"));
  });
});
