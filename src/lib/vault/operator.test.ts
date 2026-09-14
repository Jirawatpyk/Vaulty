import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  OPERATOR,
  PDPC,
  controllerFacts,
  controllerParagraphs,
  isSaleReady,
  sellerLabel,
  type Operator,
} from "./operator.ts";

describe("PDPA controller", () => {
  it("is not sale-ready until the company is filled in", () => {
    assert.equal(OPERATOR.registered, false);
    assert.equal(isSaleReady(), false);
    assert.match(sellerLabel("th"), /ยังไม่จดทะเบียน/);
    assert.match(sellerLabel("en"), /not yet incorporated/);
  });

  it("names the controller, in-app contact, and PDPC in both languages", () => {
    for (const lang of ["th", "en"] as const) {
      const blob = controllerParagraphs(lang).join(" ");
      assert.match(blob, /Vaulty/);
      assert.match(blob, /2562/);
      assert.match(blob, /ยังไม่จดทะเบียน|not yet incorporated/);
      assert.ok(blob.includes(PDPC.url));
      const facts = controllerFacts(lang);
      assert.ok(facts.some((f) => f.value.includes("Vaulty")));
      assert.ok(facts.some((f) => f.value.includes(PDPC.url)));
    }
  });

  it("switches to the juristic identity once registered", () => {
    const live: Operator = {
      ...OPERATOR,
      registered: true,
      legalNameTh: "บริษัท วอลตี้ จำกัด",
      legalNameEn: "Vaulty Co., Ltd.",
      registrationNo: "0105567000000",
      taxId: "0105567000000",
      registeredOfficeTh: "กรุงเทพมหานคร",
      registeredOfficeEn: "Bangkok",
      contactEmail: "privacy@example.com",
      dpoEmail: "dpo@example.com",
    };
    assert.equal(isSaleReady(live), true);
    const th = controllerParagraphs("th", live).join(" ");
    assert.match(th, /บริษัท วอลตี้ จำกัด/);
    assert.match(th, /privacy@example.com/);
    assert.doesNotMatch(th, /ฉบับเตรียมขายจริง/);
  });
});
