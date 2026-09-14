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

async function openNav(page, name) {
  const more = page.getByRole("button", { name: /เพิ่มเติม|^More$/i });
  if (await more.isVisible()) {
    await more.click();
    await page.getByRole("link", { name }).last().click();
  } else {
    await page.getByRole("link", { name }).first().click();
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
  await page.getByText(/ต้นฉบับอยู่นอกบ้าน/).first().waitFor({ timeout: 8000 });
  record(
    "W1",
    "หน้าภาพรวมบอกว่าต้นฉบับอยู่นอกบ้าน",
    (await page.getByText(/ต้นฉบับอยู่นอกบ้าน/).count()) > 0,
  );

  await openNav(page, /แผนส่งมอบ|^Access$|^Release plan$/i);
  await page.getByRole("heading", { name: /ต้นฉบับพินัยกรรมนอกบ้าน/ }).waitFor({ timeout: 8000 });
  record("W2", "แผงต้นฉบับพินัยกรรมนอกบ้าน", (await page.getByRole("heading", { name: /ต้นฉบับพินัยกรรมนอกบ้าน/ }).count()) > 0);
  const holder = await page.getByPlaceholder(/ชื่อสำนักงานหรือผู้ถือ/).inputValue();
  record(
    "W3",
    "คลังตัวอย่างฝากที่สำนักงานทนาย",
    holder.includes("พงศ์ไพศาล") && (await page.getByText(/ต้นฉบับอยู่นอกบ้าน/).count()) > 0,
  );

  const [dl] = await Promise.all([
    page.waitForEvent("download", { timeout: 15000 }),
    page.getByRole("button", { name: /ดาวน์โหลดชุดทนาย/ }).click(),
  ]);
  const html = readFileSync(await dl.path(), "utf8");
  record(
    "W4",
    "ชุดทนายมีที่เก็บต้นฉบับและไม่ใช่พินัยกรรม",
    /สำนักงานกฎหมายพงศ์ไพศาล/.test(html) && /PP-WILL-2568-12/.test(html) && /นี่ไม่ใช่พินัยกรรม/.test(html),
  );

  await page.getByRole("combobox", { name: /ที่เก็บต้นฉบับ/ }).click();
  await page.getByRole("option", { name: /ยังอยู่ที่บ้าน/ }).click();
  await page.waitForTimeout(300);
  record("W5", "เลือกบ้านแล้วมีคำเตือนไฟไหม้", (await page.getByText(/เสี่ยงไฟไหม้/).count()) > 0);

  await openNav(page, /เอกสาร|^Documents$/i);
  record(
    "W6",
    "หน้าเอกสารเตือนเมื่อต้นฉบับยังอยู่ที่บ้าน",
    (await page.getByText(/เสี่ยงไฟไหม้/).count()) > 0 &&
      (await page.getByRole("link", { name: /จดที่เก็บต้นฉบับ/ }).count()) > 0,
  );

  await page.getByRole("link", { name: /จดที่เก็บต้นฉบับ/ }).click();
  await page.getByRole("combobox", { name: /ที่เก็บต้นฉบับ/ }).click();
  await page.getByRole("option", { name: /ตู้นิรภัยธนาคาร/ }).click();
  await page.getByPlaceholder(/ชื่อสำนักงานหรือผู้ถือ/).fill("กสิกรไทย สาขาสยาม");
  await page.waitForTimeout(200);
  record("W7", "ตู้นิรภัยธนาคารมีคำเตือนผนึกตู้", (await page.getByText(/ถูกผนึกเมื่อเจ้าของเสียชีวิต/).count()) > 0);

  await page.getByRole("button", { name: /สลับภาษา|Switch language/i }).click();
  await page.waitForTimeout(300);
  record(
    "W8",
    "อังกฤษใช้คำ Original will, off-site",
    (await page.getByRole("heading", { name: /Original will, off-site/ }).count()) > 0,
  );
} catch (err) {
  record("runner", String(err).slice(0, 500), false);
}

const report = { passed: tasks.filter((t) => t.ok).length, total: tasks.length, tasks };
writeFileSync("/tmp/vaulty-will-custody.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
await browser.close();
process.exit(tasks.every((t) => t.ok) ? 0 : 1);
