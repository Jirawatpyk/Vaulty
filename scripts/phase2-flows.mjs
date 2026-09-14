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

  await page.getByRole("button", { name: /เปิดคลังตัวอย่าง|Open sample/i }).click();
  await page.getByRole("heading", { name: /สุทธิดา|Sutthida/i }).waitFor({ timeout: 20000 });
  report.steps.demo = true;

  await page.getByRole("link", { name: /ทายาท|Heirs/i }).first().click();
  await page.getByRole("heading", { name: /ทายาท|Heirs/i }).waitFor();
  const [dl] = await Promise.all([
    page.waitForEvent("download", { timeout: 10000 }),
    page.getByRole("button", { name: /ดาวน์โหลดทุกชุดทายาท|Download every heir pack/i }).click(),
  ]);
  const packPath = await dl.path();
  report.steps.familyPackDownload = Boolean(packPath);

  await page.getByRole("button", { name: /ดูชุดเอกสารทายาท|Preview heir packet/i }).first().click();
  await page.getByText(/ไม่ใช่พินัยกรรม|not a will/i).first().waitFor({ timeout: 8000 });
  report.steps.packetLegal = true;
  report.steps.printBtn = (await page.getByRole("button", { name: /พิมพ์แพ็กเก็ต|Print packet/i }).count()) > 0;
  await page.getByRole("button", { name: /ปิดตัวอย่าง|Close preview/i }).click();

  await page.getByRole("link", { name: /ความประสงค์|Wishes/i }).first().click();
  await page.getByRole("heading", { name: /ความประสงค์|Wishes/i }).waitFor();
  report.steps.wishes = true;

  await page.getByRole("link", { name: /เอกสาร|Documents/i }).first().click();
  await page.getByRole("heading", { name: /เอกสาร|Documents/i }).waitFor();
  report.steps.docs = true;

  await page.getByRole("link", { name: /ทรัพย์สิน|Assets/i }).first().click();
  await page.getByRole("heading", { name: /ทรัพย์สิน|Assets/i }).waitFor();
  report.steps.assets = true;

  await page.getByRole("link", { name: /แผนส่งมอบ|Release plan/i }).first().click();
  await page.getByText(/ไม่ส่งมรดก|not a will/i).first().waitFor();
  report.steps.accessLegal = true;

  await page.getByRole("button", { name: /ล็อกคลัง|^Lock$/i }).first().click();
  await page.getByRole("heading", { name: /กรอกรหัส|passcode/i }).waitFor();
  await clickDigits(page, "258036");
  await page.getByRole("heading", { name: /สุทธิดา|Sutthida/i }).waitFor({ timeout: 20000 });
  report.steps.relock = true;

  const page2 = await context.newPage();
  await page2.goto(url, { waitUntil: "networkidle" });
  await page2.getByRole("heading", { name: /กรอกรหัส|passcode/i }).waitFor({ timeout: 10000 });
  await clickDigits(page2, "258036");
  await page2.getByRole("heading", { name: /สุทธิดา|Sutthida/i }).waitFor({ timeout: 20000 });
  await page.waitForTimeout(900);
  report.steps.peerReadonly = (await page.getByText(/โหมดอ่านอย่างเดียว|read-only/i).count()) > 0;

  await page2.getByRole("button", { name: /ล็อกคลัง|^Lock$/i }).first().click();
  await page2.getByRole("heading", { name: /กรอกรหัส|passcode/i }).waitFor();
  await page2.getByRole("button", { name: /ลืมรหัส|forgot/i }).click();
  await page2.getByRole("button", { name: /^ลบคลัง$|^Erase vault$/ }).click();
  await page2.getByRole("heading", { name: "Vaulty" }).waitFor({ timeout: 10000 });

  await page2.getByRole("button", { name: /สร้างคลังใหม่|Create a vault/i }).click();
  await page2.getByPlaceholder(/ชื่อ-นามสกุล|Full name/i).fill("ครอบครัว ทดสอบ");
  await page2.getByRole("button", { name: /ดำเนินการต่อ|Continue/i }).click();
  await page2.getByRole("button", { name: /ใช้ประโยคผ่าน|Use a passphrase/i }).click();
  await page2.getByLabel(/ประโยคผ่าน|Passphrase/i).fill("garden-lotus-1968");
  await page2.getByRole("button", { name: /ดำเนินการต่อ|Continue/i }).click();
  await page2.getByLabel(/ยืนยันประโยคผ่าน|Confirm passphrase/i).fill("garden-lotus-1968");
  await page2.getByRole("button", { name: /สร้างคลังใหม่|Create a vault/i }).click();
  await page2.getByRole("heading", { name: /ครอบครัว ทดสอบ/i }).waitFor({ timeout: 20000 });
  report.steps.passphraseCreate = true;

  await page2.getByRole("button", { name: /ล็อกคลัง|^Lock$/i }).first().click();
  await page2.getByRole("heading", { name: /กรอกรหัส|passcode/i }).waitFor();
  await page2.getByRole("button", { name: /ใช้ประโยคผ่าน|Use a passphrase/i }).click();
  await page2.getByLabel(/ประโยคผ่าน|Passphrase/i).fill("garden-lotus-1968");
  await page2.getByRole("button", { name: /^เปิดคลัง$|^Unlock$/ }).click();
  await page2.getByRole("heading", { name: /ครอบครัว ทดสอบ/i }).waitFor({ timeout: 20000 });
  report.steps.passphraseUnlock = true;
} catch (err) {
  report.error = String(err).slice(0, 400);
}

await browser.close();
report.failed = Object.entries(report.steps).filter(([, v]) => !v).map(([k]) => k);
if (report.error) report.failed.push("exception");
report.ok = report.failed.length === 0;
writeFileSync("/tmp/vaulty-phase2.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
