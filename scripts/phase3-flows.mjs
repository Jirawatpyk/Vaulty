#!/usr/bin/env node
import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "node:fs";

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

  await page.getByRole("heading", { name: /ชุดส่งมอบให้ครอบครัว|Family handoff kit/i }).waitFor();
  report.steps.handoffPanel = true;

  const [portalDl] = await Promise.all([
    page.waitForEvent("download", { timeout: 15000 }),
    page.getByRole("button", { name: /ดาวน์โหลดชุดผู้จัดการมรดก|Download executor kit/i }).click(),
  ]);
  const portalPath = await portalDl.path();
  const portalHtml = readFileSync(portalPath, "utf8");
  report.steps.executorDownload = portalHtml.includes("PBKDF2") && !portalHtml.includes("seed เก็บแยกในซองคราฟต์");

  const [popup] = await Promise.all([
    context.waitForEvent("page", { timeout: 10000 }),
    page.getByRole("button", { name: /เปิดดูชุดผู้จัดการมรดก|Open executor kit/i }).click(),
  ]);
  await popup.waitForLoadState("domcontentloaded");
  await popup.locator("#secret").fill("258036");
  await popup.locator("#unlockBtn").click();
  await popup.getByText("สุทธิดา วรวัฒน์").waitFor({ timeout: 15000 });
  report.steps.portalUnlock = true;
  report.steps.portalSecrets = (await popup.getByText(/seed เก็บแยกในซองคราฟต์/i).count()) > 0;
  await popup.close();

  const [packDl] = await Promise.all([
    page.waitForEvent("download", { timeout: 10000 }),
    page.getByRole("button", { name: /ดาวน์โหลดทุกชุดทายาท|Download every heir pack/i }).click(),
  ]);
  const packHtml = readFileSync(await packDl.path(), "utf8");
  report.steps.familyNoSecrets = !packHtml.includes("seed เก็บแยกในซองคราฟต์") && /ไม่ใช่พินัยกรรม|not a will/i.test(packHtml);

  const [icsDl] = await Promise.all([
    page.waitForEvent("download", { timeout: 8000 }),
    page.getByRole("button", { name: /ใส่ปฏิทินเช็คอิน|Add check-in to calendar/i }).click(),
  ]);
  const ics = readFileSync(await icsDl.path(), "utf8");
  report.steps.ics = ics.includes("BEGIN:VCALENDAR") && ics.includes("RRULE");

  const [cardDl] = await Promise.all([
    page.waitForEvent("download", { timeout: 8000 }),
    page.getByRole("button", { name: /พิมพ์การ์ดรหัส|Print key card/i }).click(),
  ]);
  const card = readFileSync(await cardDl.path(), "utf8");
  report.steps.keyCard = /ไม่ใช่พินัยกรรม|not a will/i.test(card) && !card.includes("258036");

  const [attDl] = await Promise.all([
    page.waitForEvent("download", { timeout: 8000 }),
    page.getByRole("button", { name: /ดาวน์โหลดรายงานความปลอดภัย|Download security report/i }).click(),
  ]);
  const att = readFileSync(await attDl.path(), "utf8");
  report.steps.attestation = /PASS|WATCH|FAIL/.test(att) && /ไม่ใช่พินัยกรรม|not a will/i.test(att);

  await page.getByRole("button", { name: /ล็อกคลัง|^Lock$/i }).first().click();
  await page.getByRole("heading", { name: /กรอกรหัส|passcode/i }).waitFor();
  await clickDigits(page, "258036");
  await page.getByRole("heading", { name: /สุทธิดา|Sutthida/i }).waitFor({ timeout: 20000 });
  report.steps.relock = true;
} catch (err) {
  report.error = String(err).slice(0, 500);
}

await browser.close();
report.failed = Object.entries(report.steps).filter(([, v]) => !v).map(([k]) => k);
if (report.error) report.failed.push("exception");
report.ok = report.failed.length === 0;
writeFileSync("/tmp/vaulty-phase3.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
