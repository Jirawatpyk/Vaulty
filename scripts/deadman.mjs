#!/usr/bin/env node
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const url = process.env.GAP_URL || "http://127.0.0.1:8080/";
const tasks = [];
function record(id, title, ok, extra = {}) {
  tasks.push({ id, title, ok, extra });
}

async function wipeIfNeeded(page) {
  const forgot = page.getByRole("button", { name: /ลืมรหัส|forgot/i });
  if (await forgot.count()) {
    await forgot.click();
    await page.getByRole("heading", { name: /ลบคลังถาวร|Erase this vault/i }).waitFor({ timeout: 8000 });
    await page.getByRole("alertdialog").getByRole("button", { name: /^ลบคลัง$|^Erase vault$/ }).click({ force: true });
    await page.getByRole("heading", { name: "Vaulty" }).waitFor({ timeout: 8000 });
  }
}

async function openAccess(page) {
  const more = page.getByRole("button", { name: /เพิ่มเติม|^More$/i });
  if (await more.isVisible()) {
    await more.click();
    await page.getByRole("link", { name: /แผนส่งมอบ|^Access$|^Release plan$/i }).last().click();
  } else {
    await page.getByRole("link", { name: /แผนส่งมอบ|^Access$|^Release plan$/i }).first().click();
  }
  await page.waitForTimeout(500);
}

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: "th-TH" });
const page = await ctx.newPage();

try {
  await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
  await wipeIfNeeded(page);
  await page.getByRole("button", { name: /เปิดคลังตัวอย่าง/ }).click();
  const confirm = page.getByRole("button", { name: /เปิดคลังตัวอย่าง/ }).nth(1);
  if (await confirm.isVisible().catch(() => false)) await confirm.click();
  await page.waitForURL(/\/vault/, { timeout: 20000 });
  await openAccess(page);

  record("D1", "มีแผงสวิตช์คนตาย", (await page.getByRole("heading", { name: /สวิตช์คนตาย|Dead-man/ }).count()) > 0);
  record("D2", "บอกว่าส่งได้แม้เครื่องปิด", (await page.getByText(/แม้เครื่องปิด|even if this (phone|device) is off/i).count()) > 0);
  record("D3", "ข้อความไม่สัญญาว่าส่งรหัส", (await page.getByText(/ไม่ส่งรหัส|never includes the vault code/i).count()) > 0);

  const signIn = page.getByRole("link", { name: /เข้าสู่ระบบ|Sign in/ });
  const arm = page.getByRole("button", { name: /เปิดสวิตช์|Arm the switch/ });
  const signedIn = await arm.count();
  record("D4", "เข้าสู่ระบบหรือเปิดสวิตช์ได้", signedIn > 0 || (await signIn.count()) > 0);

  if (signedIn) {
    const mail = page.getByRole("textbox", { name: /เมลผู้จัดการมรดก|Executor email/ });
    if (await mail.count()) {
      await mail.fill("vaulty-switch@example.com");
    }
    await arm.click();
    await page.waitForTimeout(1500);
    record("D5", "เปิดสวิตช์แล้วเห็นกำหนด", (await page.getByText(/สวิตช์ติดอยู่|Switch is on/).count()) > 0);
  } else {
    record("D5", "ยังไม่ล็อกอิน — มีทางเข้าสู่ระบบ", (await signIn.count()) > 0);
  }

  const tick = await page.request.get(`${new URL(url).origin}/api/deadman/tick`);
  const body = await tick.json().catch(() => ({}));
  record("D6", "ตัวเดินเวลารับ tick", tick.ok() && typeof body.scanned === "number");
} catch (err) {
  record("runner", String(err).slice(0, 500), false);
}

const report = { passed: tasks.filter((t) => t.ok).length, total: tasks.length, tasks };
writeFileSync("/tmp/vaulty-deadman.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
await browser.close();
process.exit(tasks.every((t) => t.ok) ? 0 : 1);
