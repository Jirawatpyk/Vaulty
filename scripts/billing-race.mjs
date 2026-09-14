#!/usr/bin/env node
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const url = process.env.GAP_URL || "http://127.0.0.1:8080/";

async function wipe(page) {
  const forgot = page.getByRole("button", { name: /ลืมรหัส|forgot/i });
  if (await forgot.count()) {
    await forgot.click();
    await page.getByRole("heading", { name: /ลบคลังถาวร|Erase this vault/i }).waitFor({ timeout: 8000 });
    await page.getByRole("alertdialog").getByRole("button", { name: /^ลบคลัง$|^Erase vault$/ }).click({ force: true });
    await page.getByRole("heading", { name: "Vaulty" }).waitFor({ timeout: 8000 });
  }
}

async function signInAndOpenBilling(page, stamp) {
  await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
  await wipe(page);
  await page.getByRole("button", { name: /เปิดคลังตัวอย่าง/ }).click();
  const confirm = page.getByRole("button", { name: /เปิดคลังตัวอย่าง/ }).nth(1);
  if (await confirm.isVisible().catch(() => false)) await confirm.click();
  await page.waitForURL(/\/vault/, { timeout: 20000 });
  const more = page.getByRole("button", { name: /เพิ่มเติม|^More$/i });
  if (await more.isVisible()) {
    await more.click();
    await page.getByRole("link", { name: /แผนส่งมอบ|^Access$|^Release plan$/i }).last().click();
  } else {
    await page.getByRole("link", { name: /แผนส่งมอบ|^Access$|^Release plan$/i }).first().click();
  }
  await page.getByRole("tab", { name: /ความปลอดภัย|Security/ }).click();
  await page.getByRole("link", { name: /เข้าสู่ระบบ|Sign in/ }).first().click();
  await page.waitForURL(/\/login/, { timeout: 10000 });
  await page.locator("#consent-account").check();
  await page.getByRole("textbox", { name: /เมล|Email/ }).fill(`race.${stamp}@vaulty.test`);
  await page.locator("input[type=password]").fill("Vaulty-bill-1");
  await page.getByRole("button", { name: /สมัครบัญชี|Create account/ }).click();
  await page.waitForURL(/\/vault/, { timeout: 20000 });
  if (await more.isVisible().catch(() => false)) {
    await more.click();
    await page.getByRole("link", { name: /แผนส่งมอบ|^Access$|^Release plan$/i }).last().click();
  } else {
    await page.getByRole("link", { name: /แผนส่งมอบ|^Access$|^Release plan$/i }).first().click();
  }
  await page.getByRole("tab", { name: /ความปลอดภัย|Security/ }).click();
  await page.getByRole("button", { name: /เปิดใช้ทดสอบ · ครอบครัว/ }).waitFor({ timeout: 12000 });
}

async function activate(page) {
  await page.getByRole("button", { name: /เปิดใช้ทดสอบ · ครอบครัว/ }).click();
  await page.getByRole("button", { name: /ใช้งานทดสอบ · ครอบครัว/ }).waitFor({ timeout: 15000 });
  const text = await page.locator("#billing").innerText();
  const nos = [...text.matchAll(/VT-[RT]-[0-9]{4}-[0-9]{5}/g)].map((m) => m[0]);
  return nos;
}

const browser = await chromium.launch({ headless: true });
const t0 = Date.now();
const stamp = Date.now();
const ctxA = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "th-TH" });
const ctxB = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "th-TH" });
const pageA = await ctxA.newPage();
const pageB = await ctxB.newPage();

try {
  await Promise.all([signInAndOpenBilling(pageA, `${stamp}a`), signInAndOpenBilling(pageB, `${stamp}b`)]);
  const [a, b] = await Promise.all([activate(pageA), activate(pageB)]);
  const all = [...a, ...b];
  const unique = new Set(all);
  const ok = all.length >= 2 && unique.size === all.length;
  const result = { ok, passed: ok ? 1 : 0, total: 1, ms: Date.now() - t0, tasks: [{ id: "R1", title: "สองคนเปิดใช้พร้อมกันได้เลขที่เอกสารไม่ซ้ำ", ok, extra: { a, b } }] };
  writeFileSync("/tmp/billing-race.json", JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
  process.exit(ok ? 0 : 1);
} catch (err) {
  const result = { ok: false, passed: 0, total: 1, ms: Date.now() - t0, tasks: [{ id: "R1", title: "สองคนเปิดใช้พร้อมกันได้เลขที่เอกสารไม่ซ้ำ", ok: false, extra: { err: String(err).slice(0, 400) } }] };
  writeFileSync("/tmp/billing-race.json", JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
  process.exit(1);
}
