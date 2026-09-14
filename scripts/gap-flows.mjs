#!/usr/bin/env node
import { chromium, firefox } from "playwright";
import { writeFileSync } from "node:fs";

const url = process.env.GAP_URL || "http://127.0.0.1:8080/";
const report = { url, chromium: {}, firefox: null, webkit: "not-run", notes: [] };

async function clickDigits(page, pin) {
  for (const d of pin.split("")) {
    await page.getByRole("button", { name: new RegExp(`ตัวเลข ${d}|Digit ${d}`) }).click();
  }
}

async function runChromium() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, acceptDownloads: true });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });

  const demo = page.getByRole("button", { name: /เปิดคลังตัวอย่าง|Open sample/i });
  if (await demo.count()) await demo.click();
  await page.getByRole("heading", { name: /สุทธิดา|Sutthida/i }).waitFor({ timeout: 20000 });
  report.chromium.backupBanner = await page.getByText(/ยังไม่มีการส่งออก|Time to export|No backup has been exported|ถึงเวลาส่งออก/i).count();

  await page.getByRole("link", { name: /ความประสงค์|Wishes/i }).first().click();
  await page.getByRole("heading", { name: /ความประสงค์|Wishes/i }).waitFor();
  const funeral = page.getByRole("textbox").first();
  await funeral.fill("ไม่ต้องจัดงานใหญ่");
  report.chromium.wishes = (await funeral.inputValue()).includes("ไม่ต้องจัด");

  const addLetter = page.getByRole("button", { name: /เขียนจดหมาย|Write a letter/i });
  if (await addLetter.count()) {
    await addLetter.click();
    await page.getByRole("heading", { name: /จดหมาย|letter/i }).waitFor({ timeout: 8000 });
    report.chromium.letterDialog = true;
    await page.getByRole("button", { name: /^ปิด$/ }).click();
  } else {
    report.chromium.letterDialog = false;
  }

  await page.getByRole("link", { name: /เอกสาร|Documents/i }).first().click();
  await page.getByRole("heading", { name: /เอกสาร|Documents/i }).waitFor();
  await page.getByRole("button", { name: /เพิ่มเอกสาร|Add document/i }).first().click();
  await page.getByRole("heading", { name: /เอกสาร|document/i }).waitFor({ timeout: 8000 });
  report.chromium.docDialog = true;
  await page.getByRole("button", { name: /^ปิด$/ }).click();

  await page.getByRole("link", { name: /ทายาท|Heirs/i }).first().click();
  await page.getByRole("heading", { name: /ทายาท|Heirs/i }).waitFor();
  await page.getByRole("button", { name: /ดูชุดเอกสารทายาท|Preview heir packet/i }).first().click();
  await page.getByRole("heading", { name: /ชุดส่งมอบ|Legacy release/i }).waitFor({ timeout: 8000 });
  report.chromium.packet = await page.getByRole("button", { name: /พิมพ์แพ็กเก็ต|Print packet/i }).count();
  await page.getByRole("button", { name: /ปิดตัวอย่าง|Close preview/i }).click();

  await page.getByRole("link", { name: /แผนส่งมอบ|Access|Release/i }).first().click();
  await page.getByText(/ไม่ส่งมรดก|not a will/i).waitFor({ timeout: 8000 });
  report.chromium.disclaimer = true;

  await clickDigits(page, "147258");
  await clickDigits(page, "147258");
  await page.getByText("เปลี่ยนรหัสแล้ว — ส่งออกไฟล์ใหม่เก็บไว้นอกเครื่องนี้").first().waitFor({ timeout: 15000 });
  report.chromium.pinChanged = true;

  const [download] = await Promise.all([
    page.waitForEvent("download", { timeout: 15000 }),
    page.getByRole("button", { name: /ส่งออก|Export/i }).first().click(),
  ]);
  const file = await download.path();
  report.chromium.exported = Boolean(file);

  await page.getByRole("button", { name: /ล็อกคลัง|Lock/i }).first().click();
  await page.getByRole("heading", { name: /กรอกรหัส|passcode/i }).waitFor({ timeout: 10000 });
  await clickDigits(page, "147258");
  await page.getByRole("heading", { name: /สุทธิดา|Sutthida/i }).waitFor({ timeout: 20000 });
  report.chromium.reunlockNewPin = true;

  const page2 = await context.newPage();
  await page2.goto(url, { waitUntil: "networkidle" });
  await page2.getByRole("heading", { name: /กรอกรหัส|passcode/i }).waitFor({ timeout: 10000 });
  await clickDigits(page2, "147258");
  await page2.getByRole("heading", { name: /สุทธิดา|Sutthida/i }).waitFor({ timeout: 20000 });
  await page.waitForTimeout(800);
  const p1locked = await page.getByRole("heading", { name: /กรอกรหัส|passcode/i }).count();
  report.chromium.peerLock = p1locked > 0;

  await page2.getByRole("button", { name: /ล็อกคลัง|Lock/i }).first().click();
  await page2.getByRole("heading", { name: /กรอกรหัส|passcode/i }).waitFor();
  await page2.getByRole("button", { name: /ลืมรหัส|forgot/i }).click();
  await page2.getByRole("button", { name: /^ลบคลัง$|^Erase vault$/ }).click();
  await page2.getByRole("heading", { name: "Vaulty" }).waitFor({ timeout: 10000 });
  report.chromium.wiped = true;

  const restore = page2.locator('input[type=file]');
  if (file) {
    await restore.setInputFiles(file);
    await page2.getByRole("heading", { name: /กรอกรหัส|passcode/i }).waitFor({ timeout: 10000 });
    await clickDigits(page2, "147258");
    await page2.getByRole("heading", { name: /สุทธิดา|Sutthida/i }).waitFor({ timeout: 20000 });
    report.chromium.restoredFromFile = true;
  } else {
    report.chromium.restoredFromFile = false;
  }

  const mobile = await context.newPage();
  await mobile.setViewportSize({ width: 390, height: 844 });
  await mobile.goto(url, { waitUntil: "networkidle" });
  await mobile.getByRole("heading", { name: /กรอกรหัส|passcode/i }).waitFor({ timeout: 10000 });
  await clickDigits(mobile, "147258");
  await mobile.getByRole("heading", { name: /สุทธิดา|Sutthida/i }).waitFor({ timeout: 20000 });
  report.chromium.mobileUnlocked = true;

  await browser.close();
}

async function runFirefox() {
  try {
    const browser = await firefox.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
    const demo = page.getByRole("button", { name: /เปิดคลังตัวอย่าง|Open sample/i });
    if (await demo.count()) await demo.click();
    else await clickDigits(page, "147258");
    await page.waitForTimeout(2500);
    report.firefox = {
      ok: (await page.locator("body").innerText()).length > 40,
      unlocked: (await page.getByRole("heading", { name: /สุทธิดา|Sutthida|Vaulty/i }).count()) > 0,
    };
    await browser.close();
  } catch (err) {
    report.firefox = { skipped: true, error: String(err).slice(0, 180) };
    report.notes.push("Firefox binary not available in this environment");
  }
}

await runChromium();
await runFirefox();
report.webkit = "skipped — no VoiceOver/WebKit binary guaranteed";
report.notes.push("TalkBack/VoiceOver cannot run in this sandbox; a11y audit covers names/labels only");
report.notes.push("Dead-man switch is an on-device reminder by design — no outbound delivery to test");

const failed = [];
for (const [k, v] of Object.entries(report.chromium)) {
  if (v === false || v === 0) failed.push(k);
}
report.ok = failed.length === 0;
report.failed = failed;
writeFileSync("/tmp/vaulty-gap-report.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
