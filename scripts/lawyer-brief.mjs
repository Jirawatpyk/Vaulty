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
  record("A1", "หน้าแผนส่งมอบมีปุ่มชุดทนาย", (await page.getByRole("button", { name: /ดาวน์โหลดชุดทนาย/ }).count()) > 0);

  const [dl] = await Promise.all([
    page.waitForEvent("download", { timeout: 15000 }),
    page.getByRole("button", { name: /ดาวน์โหลดชุดทนาย/ }).click(),
  ]);
  const path = await dl.path();
  const html = readFileSync(path, "utf8");
  record("A2", "ไฟล์บอกชัดว่าไม่ใช่พินัยกรรม", /นี่ไม่ใช่พินัยกรรม/.test(html) && /ไม่โอน/.test(html));
  record("A3", "มีชื่อเจ้าของคลังและทายาท", /สุทธิดา/.test(html) && /วิชญ์/.test(html));
  record("A4", "ไม่มีรหัสลับในชุดทนาย", !/YubiKey/.test(html) && !/seed เก็บแยก/.test(html));
  record("A5", "มีช่องลายมือชื่อและพินัยกรรมที่มีอยู่", /ลายมือชื่อเจ้าของคลัง/.test(html) && /พินัยกรรม/.test(html));

  await page.getByRole("button", { name: /เปิดดูชุดทนาย/ }).click();
  await page.getByRole("article").getByRole("heading", { name: /ชุดคำสั่งเตรียมทำพินัยกรรม/ }).waitFor({ timeout: 8000 });
  record("A6", "เปิดดูชุดทนายในแอปได้", (await page.getByRole("article").getByText(/นี่ไม่ใช่พินัยกรรม/).count()) > 0);
  await page.getByRole("article").getByRole("button", { name: /ปิดตัวอย่าง/ }).click();

  await page.getByRole("button", { name: /สลับภาษา|Switch language/i }).click();
  await page.waitForTimeout(300);
  const [enDl] = await Promise.all([
    page.waitForEvent("download", { timeout: 15000 }),
    page.getByRole("button", { name: /Download lawyer brief/ }).click(),
  ]);
  const enHtml = readFileSync(await enDl.path(), "utf8");
  record("A7", "ชุดอังกฤษบอก This is not a will", /This is not a will/i.test(enHtml));
} catch (err) {
  record("runner", String(err).slice(0, 500), false);
}

const report = { passed: tasks.filter((t) => t.ok).length, total: tasks.length, tasks };
writeFileSync("/tmp/vaulty-lawyer-brief.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
await browser.close();
process.exit(tasks.every((t) => t.ok) ? 0 : 1);
