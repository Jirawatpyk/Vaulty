#!/usr/bin/env node
import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "node:fs";

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
  await page.waitForTimeout(400);
}

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: "th-TH", acceptDownloads: true });
const page = await ctx.newPage();

try {
  await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
  await wipeIfNeeded(page);
  await page.getByRole("button", { name: /เปิดคลังตัวอย่าง/ }).click();
  const confirm = page.getByRole("button", { name: /เปิดคลังตัวอย่าง/ }).nth(1);
  if (await confirm.isVisible().catch(() => false)) await confirm.click();
  await page.waitForURL(/\/vault/, { timeout: 20000 });
  await openAccess(page);

  record("B1", "มีชุดกู้ข้ามเครื่อง", (await page.getByRole("heading", { name: /กู้คลังข้ามเครื่อง/ }).count()) > 0);

  const [sealed] = await Promise.all([
    page.waitForEvent("download", { timeout: 15000 }),
    page.getByRole("button", { name: /บันทึกไฟล์คลังเข้ารหัส/ }).click(),
  ]);
  const sealedPath = await sealed.path();
  const raw = readFileSync(sealedPath, "utf8");
  const parsed = JSON.parse(raw);
  record("B2", "ไฟล์สำรองเป็นคลังเข้ารหัส", parsed?.v === 1 && typeof parsed.data === "string" && !raw.includes("258036"));
  await page.getByText(/พิมพ์นิ้วไฟล์ล่าสุด/).waitFor({ timeout: 8000 });
  record("B3", "แสดงพิมพ์นิ้วหลังส่งออก", (await page.getByText(/พิมพ์นิ้วไฟล์ล่าสุด/).count()) > 0);

  const [guide] = await Promise.all([
    page.waitForEvent("download", { timeout: 15000 }),
    page.getByRole("button", { name: /ดาวน์โหลดคู่มือกู้ข้ามเครื่อง/ }).click(),
  ]);
  const guideHtml = readFileSync(await guide.path(), "utf8");
  record("B4", "คู่มือบอกขั้นตอนกู้และห้ามส่งรหัส", /กู้คลังข้ามเครื่อง/.test(guideHtml) && /อย่าส่งรหัสผ่าน/.test(guideHtml) && !/258036/.test(guideHtml));

  const days = page.getByRole("spinbutton").or(page.locator('input[type="number"]').first());
  await page.locator('input[type="number"][min="1"][max="365"]').fill("1");
  await page.waitForTimeout(500);
  record("B5", "เลยกำหนดแล้วมีปุ่มเมลและไลน์", (await page.getByRole("button", { name: /เปิดเมลถึงผู้จัดการมรดก/ }).count()) > 0 && (await page.getByRole("button", { name: /แชร์ข้อความทางไลน์/ }).count()) > 0);
  record("B6", "ข้อความเตือนไม่สัญญาว่าส่งเองตอนเครื่องปิด", (await page.getByText(/ส่งไลน์หรือเมลเองไม่ได้ตอนเครื่องปิด/).count()) > 0);
} catch (err) {
  record("runner", String(err).slice(0, 500), false);
}

const report = { passed: tasks.filter((t) => t.ok).length, total: tasks.length, tasks };
writeFileSync("/tmp/vaulty-cross-nudge.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
await browser.close();
process.exit(tasks.every((t) => t.ok) ? 0 : 1);
