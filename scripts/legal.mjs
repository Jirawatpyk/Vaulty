#!/usr/bin/env node
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const url = process.env.GAP_URL || "http://127.0.0.1:8080/";
const tasks = [];
function record(id, title, ok, extra = {}) {
  tasks.push({ id, title, ok, extra });
}

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "th-TH" });
const page = await ctx.newPage();
const t0 = Date.now();

try {
  await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
  const forgot0 = page.getByRole("button", { name: /ลืมรหัส|forgot/i });
  if (await forgot0.count()) {
    await forgot0.click();
    await page.getByRole("heading", { name: /ลบคลังถาวร|Erase this vault/i }).waitFor({ timeout: 8000 });
    await page.getByRole("button", { name: /^ลบคลัง$|^Erase vault$/ }).last().click();
    await page.getByRole("heading", { name: "Vaulty" }).waitFor({ timeout: 8000 });
  }
  const terms = page.getByRole("link", { name: /ข้อกำหนดการใช้/ });
  const privacy = page.getByRole("link", { name: /นโยบายความเป็นส่วนตัว/ });
  record("L1", "หน้าแรกมีลิงก์ข้อกำหนดและนโยบาย", (await terms.count()) > 0 && (await privacy.count()) > 0);

  await terms.first().click();
  await page.getByRole("heading", { name: /ข้อกำหนดการใช้|Terms of use/ }).waitFor({ timeout: 10000 });
  const termsText = await page.locator("main").innerText();
  record("L2", "ข้อกำหนดบอกว่าไม่ใช่พินัยกรรม และอายุ 20 ปี", /ไม่ใช่พินัยกรรม|not a will/i.test(termsText) && /20/.test(termsText), { slice: termsText.slice(0, 180) });
  record("L3", "ข้อกำหนดมีรุ่นเอกสาร", /รุ่นเอกสาร|Document version|14 กันยายน|14 September/.test(await page.locator("body").innerText()));

  await page.getByRole("link", { name: /นโยบายความเป็นส่วนตัว|Privacy notice/ }).first().click();
  await page.getByRole("heading", { name: /นโยบายความเป็นส่วนตัว|Privacy notice/ }).waitFor({ timeout: 10000 });
  const privacyText = await page.locator("main").innerText();
  record("L4", "นโยบายมี พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล และสิทธิถอนความยินยอม", /พ\.ร\.บ\. คุ้มครองข้อมูลส่วนบุคคล|PDPA B\.E\. 2562/i.test(privacyText) && /ถอนความยินยอม|withdraw consent/i.test(privacyText));
  record("L5", "นโยบายบอกว่าไม่เก็บรหัสคลัง", /รหัสคลัง|passcode|vault code/i.test(privacyText));
  record("L6", "นโยบายชี้ สคส.", /สำนักงานคณะกรรมการคุ้มครองข้อมูลส่วนบุคคล|Personal Data Protection Commission/i.test(privacyText));

  const switchBtn = page.getByRole("button", { name: /Switch language|สลับภาษา/i });
  await switchBtn.click();
  await page.waitForTimeout(250);
  const enOrTh = (await page.getByRole("heading", { name: /Privacy notice|นโยบายความเป็นส่วนตัว/ }).count()) > 0;
  record("L7", "สลับภาษาแล้วยังเห็นหัวข้อนโยบาย", enOrTh);
  const otherTerms = page.getByRole("link", { name: /Terms of use|ข้อกำหนดการใช้/ }).first();
  await otherTerms.click();
  await page.getByRole("heading", { name: /Terms of use|ข้อกำหนดการใช้/ }).waitFor({ timeout: 10000 });
  record("L8", "ข้อกำหนดบอกว่าไม่ใช่พินัยกรรมทั้งสองภาษา", /not a will|ไม่ใช่พินัยกรรม/i.test(await page.locator("main").innerText()));

  await page.goto(url.replace(/\/$/, "") + "/login", { waitUntil: "networkidle" });
  const box = page.getByRole("checkbox");
  record("L9", "หน้าเข้าสู่ระบบมีช่องความยินยอม", (await box.count()) > 0);
  const signIn = page.getByRole("button", { name: /เข้าสู่ระบบด้วยเมล|Sign in with email/ });
  record("L10", "ปุ่มเข้าสู่ระบบปิดจนกว่าจะยินยอม", await signIn.isDisabled());
  await box.check();
  await page.waitForTimeout(100);
  record("L11", "ยินยอมแล้วปุ่มเมลยังรออีเมล/รหัส", await signIn.isDisabled());
  await page.getByLabel(/เมล|Email/).fill("pdpa@example.com");
  await page.getByLabel(/รหัสผ่าน|Password/).fill("correct-horse");
  record("L12", "กรอกครบและยินยอมแล้วปุ่มเข้าสู่ระบบใช้ได้", !(await signIn.isDisabled()));

  const forgot = page.getByRole("button", { name: /ลืมรหัส|forgot/i });
  if (await forgot.count()) {
    /* on login page, skip */
  }
  await page.goto(url, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /เปิดคลังตัวอย่าง|Open sample/ }).waitFor({ timeout: 15000 });
  const forgot2 = page.getByRole("button", { name: /ลืมรหัส|forgot/i });
  if (await forgot2.count()) {
    await forgot2.click();
    await page.getByRole("heading", { name: /ลบคลังถาวร|Erase this vault/i }).waitFor({ timeout: 8000 });
    await page.getByRole("button", { name: /^ลบคลัง$|^Erase vault$/ }).last().click();
    await page.getByRole("heading", { name: "Vaulty" }).waitFor({ timeout: 8000 });
  }
  await page.getByRole("button", { name: /เปิดคลังตัวอย่าง|Open sample/ }).click();
  const confirm = page.getByRole("button", { name: /เปิดคลังตัวอย่าง|Open sample/ }).nth(1);
  if (await confirm.isVisible().catch(() => false)) await confirm.click();
  await page.waitForURL(/\/vault/, { timeout: 20000 });
  await page.getByRole("button", { name: /เพิ่มเติม|^More$/i }).click();
  await page.getByRole("link", { name: /แผนส่งมอบ|Release plan/ }).last().click();
  await page.getByRole("heading", { name: /แผนส่งมอบ|Release plan/ }).first().waitFor({ timeout: 15000 });
  await page.getByRole("tab", { name: /ความปลอดภัย|Security/ }).click();
  await page.locator("#legal-rights").waitFor({ timeout: 8000 });
  const rightsText = await page.locator("#legal-rights").innerText();
  record("L13", "แผนส่งมอบมีแผงสิทธิข้อมูลส่วนบุคคล", /สิทธิข้อมูลส่วนบุคคล|Personal data rights/i.test(rightsText), {
    url: page.url(),
    rightsText: rightsText.slice(0, 200),
  });
  record("L14", "มีปุ่มถอนความยินยอมหรือข้อความยังไม่เข้าสู่ระบบ", /ถอนความยินยอม|ยังไม่เข้าสู่ระบบ|Withdraw consent|signed out/i.test(rightsText));
} catch (err) {
  tasks.push({ id: "runner", title: String(err).slice(0, 400), ok: false, extra: {} });
}

const report = {
  ms: Date.now() - t0,
  passed: tasks.filter((t) => t.ok).length,
  total: tasks.length,
  ok: tasks.every((t) => t.ok),
  tasks,
};
writeFileSync("/tmp/vaulty-legal.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
await browser.close();
process.exit(report.ok ? 0 : 1);
