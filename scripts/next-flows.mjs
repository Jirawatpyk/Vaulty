#!/usr/bin/env node
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const url = process.env.GAP_URL || "http://127.0.0.1:8080/";
const report = { url, ok: false, steps: {}, failed: [] };

async function clickDigits(page, pin) {
  for (const d of pin.split("")) {
    await page.getByRole("button", { name: new RegExp(`ตัวเลข ${d}|Digit ${d}`) }).click();
  }
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, acceptDownloads: true });
const page = await context.newPage();
await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });

try {
  const forgot = page.getByRole("button", { name: /ลืมรหัส|forgot/i });
  if (await forgot.count()) {
    await forgot.click();
    await page.getByRole("button", { name: /^ลบคลัง$|^Erase vault$/ }).click();
    await page.getByRole("heading", { name: "Vaulty" }).waitFor({ timeout: 8000 });
  }

  await page.getByRole("button", { name: /สร้างคลังใหม่|Create a vault/i }).click();
  await page.getByPlaceholder(/ชื่อ-นามสกุล|Full name/i).fill("จิรวัฒน์ ทดลอง");
  await page.getByRole("button", { name: /ดำเนินการต่อ|Continue/i }).click();
  await clickDigits(page, "147258");
  await clickDigits(page, "147258");
  await page.getByRole("heading", { name: /สำรองคลังก่อนใช้งาน|Back up the vault first/i }).waitFor({ timeout: 20000 });
  report.steps.recoveryGate = true;

  const confirm = page.getByRole("button", { name: /ฉันเก็บไฟล์และเขียนรหัสแล้ว|I have stored/i });
  report.steps.confirmDisabled = !(await confirm.isEnabled());

  const gate = page.getByRole("dialog");
  const [vaultDl] = await Promise.all([
    page.waitForEvent("download", { timeout: 10000 }),
    gate.getByRole("button", { name: /ส่งออกตอนนี้|Export now/i }).click(),
  ]);
  report.steps.exported = Boolean(await vaultDl.path());

  const [cardDl] = await Promise.all([
    page.waitForEvent("download", { timeout: 10000 }),
    gate.getByRole("button", { name: /พิมพ์การ์ดรหัส|Print key card/i }).click(),
  ]);
  report.steps.card = Boolean(await cardDl.path());

  await confirm.click();
  await page.getByRole("heading", { name: /จิรวัฒน์ ทดลอง/i }).waitFor({ timeout: 10000 });
  report.steps.entered = true;

  await page.getByRole("link", { name: /เอกสาร|Documents/i }).first().click();
  await page.getByRole("button", { name: /เพิ่มเอกสาร|Add document/i }).first().click();
  await page.getByLabel(/ชื่อ|Name/i).fill("พินัยกรรมจำลอง");
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles({ name: "will.txt", mimeType: "text/plain", buffer: Buffer.from("last wishes") });
  await page.getByRole("button", { name: /^บันทึก$|^Save$/ }).click();
  await page.getByText("พินัยกรรมจำลอง").waitFor({ timeout: 8000 });
  report.steps.attached = (await page.getByText("will.txt").count()) > 0;
} catch (err) {
  report.error = String(err).slice(0, 500);
}

await browser.close();
report.failed = Object.entries(report.steps).filter(([, v]) => !v).map(([k]) => k);
if (report.error) report.failed.push("exception");
report.ok = report.failed.length === 0;
writeFileSync("/tmp/vaulty-next.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
