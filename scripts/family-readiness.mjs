#!/usr/bin/env node
import { chromium } from "playwright";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const url = process.env.GAP_URL || "http://127.0.0.1:8080/";
const tasks = [];
const findings = [];

function record(id, title, ok, extra = {}) {
  tasks.push({ id, title, ok, ...extra });
  if (!ok) findings.push({ id, title, extra });
}

async function clickDigits(page, pin) {
  for (const d of pin.split("")) {
    await page.getByRole("button", { name: new RegExp(`ตัวเลข ${d}|Digit ${d}`) }).click();
  }
}

async function openDemo(page) {
  const forgot = page.getByRole("button", { name: /ลืมรหัส|forgot/i });
  if (await forgot.count()) {
    await forgot.click();
    await page.getByRole("heading", { name: /ลบคลังถาวร|Erase this vault/i }).waitFor({ timeout: 8000 });
    await page.getByRole("alertdialog").getByRole("button", { name: /^ลบคลัง$|^Erase vault$/ }).click({ force: true });
    await page.getByRole("heading", { name: "Vaulty" }).waitFor({ timeout: 8000 });
  }
  await page.getByRole("button", { name: /เปิดคลังตัวอย่าง/ }).click();
  const confirm = page.getByRole("button", { name: /เปิดคลังตัวอย่าง/ }).nth(1);
  if (await confirm.isVisible().catch(() => false)) await confirm.click();
  await page.waitForURL(/\/vault/, { timeout: 20000 });
  await page.waitForTimeout(400);
}

const browser = await chromium.launch({ headless: true });
const dir = mkdtempSync(join(tmpdir(), "vaulty-kit-"));

try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    locale: "th-TH",
    acceptDownloads: true,
  });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(300);

  // --- A. Elderly / VoiceOver ---
  const a11y = await page.evaluate(() => {
    const rgb = (c) => {
      const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : [0, 0, 0];
    };
    const lum = ([r, g, b]) => {
      const s = [r, g, b].map((v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * s[0] + 0.7152 * s[1] + 0.0722 * s[2];
    };
    const contrast = (a, b) => {
      const L1 = lum(rgb(a));
      const L2 = lum(rgb(b));
      const hi = Math.max(L1, L2);
      const lo = Math.min(L1, L2);
      return (hi + 0.05) / (lo + 0.05);
    };
    const h1 = document.querySelector("h1");
    const legal = [...document.querySelectorAll("p, div")].find((el) => {
      const t = (el.textContent || "").replace(/\s+/g, " ").trim();
      return /ไม่โอนบ้าน|will not transfer/i.test(t) && t.length < 160;
    });
    const lang = document.documentElement.lang;
    const skip = document.querySelector("a[href='#vault-main']");
    const h1Px = h1 ? parseFloat(getComputedStyle(h1).fontSize) : 0;
    const legalPx = legal ? parseFloat(getComputedStyle(legal).fontSize) : 0;
    const legalColor = legal ? getComputedStyle(legal).color : "";
    const legalBg = legal ? getComputedStyle(legal).backgroundColor : "";
    const unnamed = [...document.querySelectorAll("button, a[href]")].filter((el) => {
      const name = (el.getAttribute("aria-label") || el.textContent || "").replace(/\s+/g, " ").trim();
      return !name && el.getAttribute("aria-hidden") !== "true";
    }).length;
    return {
      lang,
      h1: h1?.textContent?.trim() || "",
      h1Px,
      legal: legal?.textContent?.trim().slice(0, 140) || "",
      legalPx,
      legalContrast: legal && legalBg !== "rgba(0, 0, 0, 0)" ? contrast(legalColor, legalBg) : contrast(legalColor, getComputedStyle(document.body).backgroundColor),
      unnamed,
      hasSkip: Boolean(skip),
    };
  });
  record("A1", "html lang เป็นไทย สำหรับ VoiceOver", a11y.lang === "th", a11y);
  record("A2", "หัวข้อหลัก ≥ 24px", a11y.h1Px >= 24, { h1Px: a11y.h1Px });
  record("A3", "ข้อความกฎหมาย ≥ 14px", a11y.legalPx >= 14, { legalPx: a11y.legalPx, legal: a11y.legal });
  record("A4", "ปุ่ม/ลิงก์มีชื่อที่อ่านได้", a11y.unnamed === 0, { unnamed: a11y.unnamed });
  record("A5", "ข้อความกฎหมายพูดตรง ๆ ว่าไม่โอนทรัพย์สิน", /ไม่โอนบ้าน|will not transfer/i.test(a11y.legal), { legal: a11y.legal });

  await openDemo(page);

  const vaultA11y = await page.evaluate(() => {
    const nav = document.querySelector("nav[aria-label='เมนูล่าง']");
    const navPx = nav ? parseFloat(getComputedStyle(nav.querySelector("a,button")).fontSize) : 0;
    const live = document.querySelector("[aria-live]");
    const h1 = document.querySelector("h1");
    const lang = document.documentElement.lang;
    return { navPx, hasLive: Boolean(live), h1: h1?.textContent?.trim() || "", lang };
  });
  record("A6", "แถบล่างตัวอักษร ≥ 12px", vaultA11y.navPx >= 12, vaultA11y);
  record("A7", "มี live region ให้โปรแกรมอ่านหน้าจอ", vaultA11y.hasLive);

  // --- B. Legal comprehension on access + portal copy ---
  await page.getByRole("button", { name: /เพิ่มเติม/ }).click();
  await page.getByRole("link", { name: /^แผนส่งมอบ$/ }).last().click();
  await page.waitForTimeout(400);
  const accessLegal = await page.getByText(/ไม่ส่งอีเมล|does not email/i).textContent();
  record("B1", "หน้าแผนส่งมอบบอกว่าไม่ส่งอีเมล/รหัส", /ไม่ส่งอีเมล/.test(accessLegal || ""), { accessLegal });
  const handoffLegal = await page.getByText(/ไม่ใช่พินัยกรรม|not a will/i).first().textContent();
  record("B2", "ชุดส่งมอบบอกว่าไม่ใช่พินัยกรรม", /ไม่ใช่พินัยกรรม/.test(handoffLegal || ""), { handoffLegal });

  // --- C. Executor kit on a fresh device ---
  const kitBtn = page.getByRole("button", { name: /ดาวน์โหลดชุดผู้จัดการมรดก/ });
  const [kitDl] = await Promise.all([
    page.waitForEvent("download", { timeout: 20000 }),
    kitBtn.click(),
  ]);
  const kitPath = join(dir, "vaulty-executor-kit.html");
  await kitDl.saveAs(kitPath);
  const kitHtml = await kitDl.path().then(async (p) => (await import("node:fs")).readFileSync(p, "utf8"));
  record("C1", "ไฟล์ชุดผู้จัดการมรดกไม่มีรหัสลับเป็นข้อความล้วน", !/258036/.test(kitHtml) && /AES-GCM|PBKDF2/.test(kitHtml));

  const other = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "th-TH" });
  const familyPage = await other.newPage();
  await familyPage.route("**/*", (route) => {
    if (route.request().isNavigationRequest()) {
      return route.fulfill({ status: 200, contentType: "text/html; charset=utf-8", body: kitHtml });
    }
    return route.continue();
  });
  await familyPage.goto(url, { waitUntil: "domcontentloaded" });
  const secure = await familyPage.evaluate(() => window.isSecureContext && Boolean(crypto.subtle));
  record("C2", "เครื่องใหม่เปิดไฟล์ในบริบทปลอดภัย", secure);

  await familyPage.locator("#secret").fill("000000");
  await familyPage.locator("#gate").evaluate((form) => form.requestSubmit());
  await familyPage.waitForTimeout(500);
  const wrong = await familyPage.locator("#err").textContent();
  record("C3", "รหัสผิดบนเครื่องครอบครัวมีข้อความ", /ไม่ถูกต้อง|incorrect/i.test(wrong || ""), { wrong });

  await familyPage.locator("#secret").fill("258036");
  await familyPage.locator("#gate").evaluate((form) => form.requestSubmit());
  await familyPage.locator("#view").waitFor({ state: "visible", timeout: 15000 });
  const unlocked = await familyPage.locator("#view").isVisible();
  const notWill = await familyPage.getByText(/ไม่ใช่พินัยกรรม|not a will/i).count();
  const heirsShown = await familyPage.locator("#view li").count();
  record("C4", "ใส่รหัสถูกแล้วเห็นทายาทบนเครื่องใหม่", unlocked && heirsShown > 0, { unlocked, heirsShown });
  record("C5", "ชุดที่เปิดแล้วยังบอกว่าไม่ใช่พินัยกรรม", notWill > 0);
  await other.close();

  // --- D. Walk-away session lock ---
  await page.bringToFront();
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.waitForTimeout(21000);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => false });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.waitForTimeout(800);
  const lockedHide = (await page.getByText(/กรอกรหัส|Enter PIN|เซสชันหมดอายุ|Session expired/i).count()) > 0 || page.url().replace(/\/$/, "").endsWith("");
  const pinPad = await page.getByRole("button", { name: /ตัวเลข 1|Digit 1/ }).count();
  record("D1", "สลับแอป/ปิดจอ 20 วินาทีแล้วคลังล็อก", pinPad > 0, { url: page.url(), pinPad, lockedHide });

  await openDemo(page);
  await page.getByRole("button", { name: /เพิ่มเติม/ }).click();
  await page.getByRole("link", { name: /^แผนส่งมอบ$/ }).last().click();
  await page.waitForTimeout(300);
  const slider = page.getByRole("slider", { name: /ล็อกอัตโนมัติ|Auto-lock/i });
  if (await slider.count()) {
    await slider.fill("1");
    await page.waitForTimeout(62000);
    const pinAfterIdle = await page.getByRole("button", { name: /ตัวเลข 1|Digit 1/ }).count();
    record("D2", "ไม่แตะเครื่อง 1 นาทีแล้วคลังล็อก", pinAfterIdle > 0, { pinAfterIdle, url: page.url() });
  } else {
    record("D2", "ไม่แตะเครื่อง 1 นาทีแล้วคลังล็อก", false, { reason: "no slider" });
  }
} catch (err) {
  findings.push({ id: "runner", title: String(err).slice(0, 500) });
}

const report = {
  passed: tasks.filter((t) => t.ok).length,
  total: tasks.length,
  ok: findings.length === 0,
  tasks,
  findings,
};
writeFileSync("/tmp/vaulty-family-readiness.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
await browser.close();
process.exit(0);
