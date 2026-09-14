#!/usr/bin/env node
import { chromium } from "playwright";
import { writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

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

async function openSecurity(page) {
  const more = page.getByRole("button", { name: /เพิ่มเติม|^More$/i });
  if (await more.isVisible()) {
    await more.click();
    await page.getByRole("link", { name: /แผนส่งมอบ|^Access$|^Release plan$/i }).last().click();
  } else {
    await page.getByRole("link", { name: /แผนส่งมอบ|^Access$|^Release plan$/i }).first().click();
  }
  await page.getByRole("tab", { name: /ความปลอดภัย|Security/ }).click();
  await page.getByRole("heading", { name: /แพ็กเกจและใบกำกับ|Plans and invoices/ }).waitFor({ timeout: 10000 });
}

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "th-TH" });
const page = await ctx.newPage();
const t0 = Date.now();

try {
  await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
  await wipeIfNeeded(page);
  await page.getByRole("button", { name: /เปิดคลังตัวอย่าง/ }).click();
  const confirm = page.getByRole("button", { name: /เปิดคลังตัวอย่าง/ }).nth(1);
  if (await confirm.isVisible().catch(() => false)) await confirm.click();
  await page.waitForURL(/\/vault/, { timeout: 20000 });
  await openSecurity(page);

  record("E1", "ยังไม่เข้าสู่ระบบ — ไม่มีปุ่มเปิดใช้ทดสอบ", (await page.getByRole("button", { name: /เปิดใช้ทดสอบ|Activate test plan/ }).count()) === 0);

  await page.getByRole("link", { name: /เข้าสู่ระบบ|Sign in/ }).first().click();
  await page.waitForURL(/\/login/, { timeout: 10000 });
  await page.locator("#consent-account").check();
  const mail = `edge.bill.${Date.now()}@vaulty.test`;
  await page.getByRole("textbox", { name: /เมล|Email/ }).fill(mail);
  await page.locator("input[type=password]").fill("Vaulty-bill-1");
  await page.getByRole("button", { name: /สมัครบัญชี|Create account/ }).click();
  await page.waitForURL(/\/vault/, { timeout: 20000 });
  await openSecurity(page);
  await page.getByRole("button", { name: /เปิดใช้ทดสอบ · ครอบครัว/ }).waitFor({ timeout: 12000 });

  const tax = page.getByPlaceholder("0105551234567");
  await tax.fill("123456789012");
  await page.getByText("เลขผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก").waitFor({ timeout: 4000 });
  record("E2", "เลขผู้เสียภาษี 12 หลักกันบันทึก", await page.getByRole("button", { name: /บันทึกข้อมูลผู้ซื้อ/ }).isDisabled());

  await tax.fill("");
  await tax.fill("123-456-789-0123");
  record("E3", "ขีดคั่นถูกลบเหลือ 13 หลัก", (await tax.inputValue()) === "1234567890123");
  record("E4", "ครบ 13 หลักแล้วบันทึกได้", !(await page.getByRole("button", { name: /บันทึกข้อมูลผู้ซื้อ/ }).isDisabled()));

  await tax.fill("");
  await page.getByPlaceholder(/บจก|ชื่อ-นามสกุล/).fill('<img src=x onerror=alert(1)>');
  await page.getByRole("button", { name: /เปิดใช้ทดสอบ · ครอบครัว/ }).click();
  await page.getByText("เปิดแพ็กเกจทดสอบแล้ว", { exact: true }).waitFor({ timeout: 10000 });
  const receipts = await page.getByText(/ใบเสร็จรับเงิน \(ทดสอบ\)/).count();
  const invoices = await page.getByText(/ใบกำกับภาษี \(ทดสอบ\)/).count();
  record("E5", "ไม่มีเลขผู้เสียภาษี — มีใบเสร็จ ไม่มีใบกำกับ", receipts >= 1 && invoices === 0, { receipts, invoices });

  record("E6", "แพ็กเกจเดิมกดซ้ำไม่ได้", await page.getByRole("button", { name: /ใช้งานทดสอบ · ครอบครัว/ }).isDisabled());

  await tax.fill("1234567890123");
  await page.locator("#billing textarea").fill("123 ถ.ทดสอบ จ.ระยอง");
  await page.getByRole("button", { name: /บันทึกข้อมูลผู้ซื้อ/ }).click();
  await page.getByText(/บันทึกข้อมูลผู้ซื้อแล้ว/).waitFor({ timeout: 10000 });
  await page.getByRole("button", { name: /เปิดใช้ทดสอบ · มรดก/ }).click();
  await page.getByRole("button", { name: /ใช้งานทดสอบ · มรดก/ }).waitFor({ timeout: 10000 });
  record("E7", "สลับเป็นมรดกแล้วออกใบกำกับเมื่อมีเลขผู้เสียภาษี", (await page.getByText(/ใบกำกับภาษี \(ทดสอบ\)/).count()) >= 1);

  const [dl] = await Promise.all([
    page.waitForEvent("download", { timeout: 15000 }),
    page.getByRole("button", { name: /ดาวน์โหลด/ }).first().click(),
  ]);
  const out = join(tmpdir(), "vaulty-edge-receipt.html");
  await dl.saveAs(out);
  const html = readFileSync(out, "utf8");
  record(
    "E8",
    "ชื่อผู้ซื้อที่เป็นแท็กไม่รันเป็นสคริปต์ในไฟล์",
    html.includes("&" + "lt;img") && !/<img src=x onerror/.test(html) && /เอกสารทดสอบ/.test(html),
    { slice: html.slice(html.indexOf("ผู้ซื้อ"), html.indexOf("ผู้ซื้อ") + 180) },
  );

  await page.getByRole("button", { name: /ยกเลิกแพ็กเกจทดสอบ/ }).click();
  await page.getByText("ยกเลิกแล้ว", { exact: true }).waitFor({ timeout: 12000 });
  record("E9", "ยกเลิกแล้วทดลอง 14 วันไม่กลับมา (ใช้สิทธิ์ไปแล้ว)", (await page.getByRole("button", { name: /เริ่มทดลอง 14 วัน/ }).count()) === 0);

  await page.getByRole("button", { name: /เปิดใช้ทดสอบ · ครอบครัว/ }).click();
  await page.getByRole("button", { name: /ใช้งานทดสอบ · ครอบครัว/ }).waitFor({ timeout: 10000 });
  record("E10", "ยกเลิกแล้วเปิดครอบครัวใหม่ได้", (await page.getByRole("button", { name: /ใช้งานทดสอบ · ครอบครัว/ }).count()) > 0);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 4);
  record("E11", "ชื่อยาว/แท็กไม่ทำให้หน้าล้นแนวนอน", !overflow);
} catch (err) {
  record("EX", "รันไม่ครบ", false, { err: String(err).slice(0, 400) });
}

const result = { ms: Date.now() - t0, passed: tasks.filter((x) => x.ok).length, total: tasks.length, ok: tasks.every((x) => x.ok), tasks };
writeFileSync("/tmp/billing-edge.json", JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
await browser.close();
process.exit(result.ok ? 0 : 1);
