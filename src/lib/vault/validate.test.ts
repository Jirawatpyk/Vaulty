import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  checkInDays,
  letterBody,
  moneyValue,
  optionalContact,
  optionalDob,
  optionalEmail,
  optionalPhone,
  requiredName,
  sharePercent,
} from "./validate.ts";

describe("requiredName", () => {
  it("rejects blank, short, and oversized names", () => {
    assert.equal(requiredName("  "), "errRequired");
    assert.equal(requiredName("ก"), "errNameShort");
    assert.equal(requiredName("A"), "errNameShort");
    assert.equal(requiredName("สุทธิดา วรวัฒน์"), null);
    assert.equal(requiredName("x".repeat(81)), "errTooLong");
  });
});

describe("email / phone / contact", () => {
  it("allows empty optional fields", () => {
    assert.equal(optionalEmail(""), null);
    assert.equal(optionalPhone(""), null);
    assert.equal(optionalContact(""), null);
  });

  it("rejects malformed email and phone", () => {
    assert.equal(optionalEmail("not-an-email"), "errEmail");
    assert.equal(optionalEmail("a@b.c"), "errEmail");
    assert.equal(optionalEmail("heir@family.co.th"), null);
    assert.equal(optionalPhone("123"), "errPhone");
    assert.equal(optionalPhone("+66 81 234 5678"), null);
    assert.equal(optionalContact("ab"), "errContact");
    assert.equal(optionalContact("lawyer@firm.com"), null);
  });
});

describe("dates and numbers", () => {
  it("accepts real ISO dates and rejects the future", () => {
    assert.equal(optionalDob(""), null);
    assert.equal(optionalDob("1968-03-14"), null);
    assert.equal(optionalDob("1968-13-01"), "errDate");
    assert.equal(optionalDob("2099-01-01", new Date("2026-09-14")), "errDateFuture");
  });

  it("clamps money, share, and check-in range", () => {
    assert.equal(moneyValue(-1), "errNegative");
    assert.equal(moneyValue("abc"), "errNumber");
    assert.equal(moneyValue(12_500_000), null);
    assert.equal(sharePercent(101), "errShare");
    assert.equal(sharePercent(40), null);
    assert.equal(checkInDays(0), "errDays");
    assert.equal(checkInDays(30), null);
  });
});

describe("letter body", () => {
  it("requires a real message", () => {
    assert.equal(letterBody(""), "errRequired");
    assert.equal(letterBody("สั้นไป"), "errLetterShort");
    assert.equal(letterBody("จดหมายฉบับนี้เขียนถึงลูกสาว"), null);
  });
});
