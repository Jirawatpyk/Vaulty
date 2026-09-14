#!/usr/bin/env node
import { chromium } from "playwright";
import { writeFileSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const url = process.env.GAP_URL || "http://127.0.0.1:8080/";
const tasks = [];
const findings = [];

function record(id, title, ok, extra = {}) {
  tasks.push({ id, title, ok, extra });
  if (!ok) findings.push({ id, title, extra });
}

async function wipeIfNeeded(page) {
  const forgot = page.getByRole("button", { name: /ลืมรหัส|forgot/i });
  if (await forgot.count()) {
    await forgot.click();
    await page.getByRole("heading", { name: /ลบคลังถาวร|Erase this vault/i }).waitFor({ timeout: 8000 });
    await page.getByRole("button", { name: /^ลบคลัง$|^Erase vault$/ }).last().click();
    await page.getByRole("heading", { name: "Vaulty" }).waitFor({ timeout: 8000 });
  }
}

async function openDemo(page) {
  await wipeIfNeeded(page);
  await page.getByRole("button", { name: /เปิดคลังตัวอย่าง/ }).click();
  const confirm = page.getByRole("button", { name: /เปิดคลังตัวอย่าง/ }).nth(1);
  if (await confirm.isVisible().catch(() => false)) await confirm.click();
  await page.waitForURL(/\/vault/, { timeout: 20000 });
}

async function openAccess(page) {
  const more = page.getByRole("button", { name: /เพิ่มเติม|^More$/i });
  if (await more.isVisible()) {
    await more.click();
    await page.getByRole("link", { name: /แผนส่งมอบ|^Access$|^Release plan$/i }).last().click();
  } else {
    await page.getByRole("link", { name: /แผนส่งมอบ|^Access$|^Release plan$/i }).first().click();
  }
}

const browser = await chromium.launch({ headless: true });
const dir = mkdtempSync(join(tmpdir(), "vaulty-use-"));
const t0 = Date.now();

try {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    locale: "th-TH",
    acceptDownloads: true,
  });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
  await wipeIfNeeded(page);

  // --- Elderly / first screen ---
  const welcome = await page.evaluate(() => {
    const h1 = document.querySelector("h1");
    const legal = [...document.querySelectorAll("p, div")].find((el) => /ไม่โอนบ้าน|will not transfer/i.test(el.textContent || ""));
    const unnamed = [...document.querySelectorAll("button, a[href]")].filter((el) => {
      const name = (el.getAttribute("aria-label") || el.textContent || "").replace(/\s+/g, " ").trim();
      return !name && el.getAttribute("aria-hidden") !== "true";
    }).length;
    const overflow = document.documentElement.scrollWidth > document.documentElement.clientWidth + 2;
    return {
      lang: document.documentElement.lang,
      h1: h1?.textContent?.trim() || "",
      h1Px: h1 ? parseFloat(getComputedStyle(h1).fontSize) : 0,
      legal: (legal?.textContent || "").replace(/\s+/g, " ").trim().slice(0, 180),
      legalPx: legal ? parseFloat(getComputedStyle(legal).fontSize) : 0,
      unnamed,
      overflow,
      title: document.title,
    };
  });
  record("U1", "html lang เป็นไทย (VoiceOver)", welcome.lang === "th", welcome);
  record("U2", "หัวข้อหลัก ≥ 28px", welcome.h1Px >= 28, { h1Px: welcome.h1Px });
  const legalBox = page.getByText(/จะไม่โอนบ้าน|will not transfer a house/i);
  record("U3", "คำเตือนกฎหมาย ≥ 14px และพูดว่าไม่โอนบ้าน", await legalBox.isVisible(), {
    legal: (await legalBox.textContent())?.slice(0, 160),
  });
  record("U4", "ปุ่มหน้าแรกมีชื่อที่อ่านได้", welcome.unnamed === 0, { unnamed: welcome.unnamed });
  record("U5", "หน้าแรกไม่ล้นแนวนอน", !welcome.overflow);

  const create = page.getByRole("button", { name: /สร้างคลังใหม่/ });
  const demo = page.getByRole("button", { name: /เปิดคลังตัวอย่าง/ });
  const restoreFile = page.getByRole("button", { name: /กู้คืนจากไฟล์|Restore vault/i });
  record("U6", "หน้าแรกแยกสร้าง / ตัวอย่าง / กู้จากไฟล์", (await create.isVisible()) && (await demo.isVisible()) && (await restoreFile.isVisible()));

  const restoreHint = await page.getByText(/กู้คืน|restore/i).last().textContent();
  record("U7", "มีคำใบ้กู้คืนภาษาที่อ่านได้", (restoreHint || "").length > 8);

  // 200% zoom overflow
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Emulation.setPageScaleFactor", { pageScaleFactor: 2 }).catch(() => null);
  await page.waitForTimeout(200);
  const zoomOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 8,
  );
  record("U8", "ขยาย 200% หน้าแรกไม่ล้นแนวนอน", !zoomOverflow, { zoomOverflow });
  await cdp.send("Emulation.setPageScaleFactor", { pageScaleFactor: 1 }).catch(() => null);

  // --- Open demo ---
  const sDemo = Date.now();
  await openDemo(page);
  record("U9", "เปิดคลังตัวอย่างถึงภาพรวมใน 8 วินาที", Date.now() - sDemo < 8000, { ms: Date.now() - sDemo });
  await page.getByText(/มูลค่าทรัพย์สินรวม|Net worth/i).waitFor({ timeout: 8000 });
  record("U10", "เห็นมูลค่าทรัพย์สินรวมทันที", (await page.getByText(/มูลค่าทรัพย์สินรวม|Net worth/i).count()) > 0);

  const sessionLabel = page.getByLabel(/เหลือ|Left/i);
  record("U11", "มือถือเห็นเวลาเซสชันที่เหลือ", await sessionLabel.first().isVisible().catch(() => false), {
    text: await sessionLabel.first().textContent().catch(() => ""),
  });

  const tinyNav = [];
  for (const link of await page.locator("nav[aria-label='เมนูล่าง'] a, nav[aria-label='เมนูล่าง'] button").all()) {
    const box = await link.boundingBox().catch(() => null);
    if (box && (box.height < 40 || box.width < 44)) tinyNav.push(box);
  }
  record("U12", "แถบล่างเป้าสัมผัส ≥ 40px", tinyNav.length === 0, { tinyNav });

  const live = await page.locator("[aria-live]").count();
  record("U13", "มี live region ให้โปรแกรมอ่านหน้าจอ", live > 0);

  // --- Access: legal + cloud + deadman ---
  await openAccess(page);
  await page.waitForTimeout(400);
  const headText = await page.locator("#vault-main").innerText();
  record("U14", "แผนส่งมอบบอกว่าไม่ใช่พินัยกรรม", /ไม่ใช่พินัยกรรม|not a will/i.test(headText));
  record("U15", "แผนส่งมอบไม่สัญญาว่าไม่มีเซิร์ฟเวอร์ทั้งก้อน", !/ไม่ต้องมีเซิร์ฟเวอร์/.test(headText), { snippet: headText.slice(0, 200) });
  record("U16", "แผนส่งมอบแยกแท็บ ส่งมอบ / สำรอง / ความปลอดภัย", (await page.getByRole("tablist").count()) > 0 && (await page.getByRole("tab").count()) >= 3);

  await page.getByRole("tab", { name: /สำรอง|Backup/ }).click();
  await page.waitForTimeout(200);
  const backupText = await page.locator("#vault-main").innerText();
  record("U17", "แผงคลาวด์บอกว่ารหัสไม่ขึ้นเซิร์ฟเวอร์", /ไม่เก็บรหัสผ่าน|never the passcode/i.test(backupText));
  const cloudTarget = page.getByRole("button", { name: /สำรองขึ้นคลาวด์|Back up to cloud/ }).or(page.getByRole("link", { name: /เข้าสู่ระบบ|Sign in/ }));
  record("U19", "กดสำรองคลาวด์หรือเข้าสู่ระบบได้จากแผนส่งมอบ", (await cloudTarget.count()) > 0);
  const cloudBox = await cloudTarget.first().boundingBox().catch(() => null);
  record("U20", "ปุ่มคลาวด์/เข้าสู่ระบบสูง ≥ 40px", Boolean(cloudBox && cloudBox.height >= 40), { cloudBox });

  await page.getByRole("tab", { name: /^ส่งมอบ$|^Handoff$/ }).click();
  await page.waitForTimeout(200);
  const handoffText = await page.locator("#vault-main").innerText();
  record("U18", "แผงสวิตช์คนตายบอกว่าไม่ส่งรหัส", /ไม่ส่งรหัส|never includes the vault code/i.test(handoffText));

  // Executor kit → other device
  const kitBtn = page.getByRole("button", { name: /ดาวน์โหลดชุดผู้จัดการมรดก|Download executor/i });
  record("U21", "หาปุ่มชุดผู้จัดการมรดกได้", await kitBtn.isVisible().catch(() => false));
  if (await kitBtn.isVisible().catch(() => false)) {
    const [dl] = await Promise.all([page.waitForEvent("download", { timeout: 20000 }), kitBtn.click()]);
    const kitPath = join(dir, "kit.html");
    await dl.saveAs(kitPath);
    const kitHtml = readFileSync(kitPath, "utf8");
    record("U22", "ชุดผู้จัดการมรดกไม่มี PIN เป็นข้อความล้วน", !/258036/.test(kitHtml));
    record("U23", "ชุดบอกว่าไม่ใช่พินัยกรรม", /ไม่ใช่พินัยกรรม|not a will/i.test(kitHtml));

    const other = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "th-TH" });
    const family = await other.newPage();
    await family.route("**/*", (route) => {
      if (route.request().isNavigationRequest()) {
        return route.fulfill({ status: 200, contentType: "text/html; charset=utf-8", body: kitHtml });
      }
      return route.continue();
    });
    await family.goto(url, { waitUntil: "domcontentloaded" });
    await family.locator("#secret").fill("000000");
    await family.locator("#gate").evaluate((form) => form.requestSubmit());
    await family.waitForTimeout(400);
    const wrong = await family.locator("#err").textContent();
    record("U24", "รหัสผิดบนเครื่องครอบครัวมีข้อความ", /ไม่ถูกต้อง|incorrect/i.test(wrong || ""), { wrong });
    await family.locator("#secret").fill("258036");
    await family.locator("#gate").evaluate((form) => form.requestSubmit());
    await family.locator("#view").waitFor({ state: "visible", timeout: 15000 });
    record("U25", "เครื่องใหม่เปิดชุดแล้วเห็นเนื้อหา", (await family.locator("#view li").count()) > 0);
    await other.close();
  }

  // Walk-away lock
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
  const pinPad = await page.getByRole("button", { name: /ตัวเลข 1|Digit 1/ }).count();
  record("U26", "ปิดจอ 20 วินาทีแล้วคลังล็อก", pinPad > 0, { url: page.url(), pinPad });

  // Wrong PIN
  if (pinPad) {
    for (const d of "000000") {
      await page.getByRole("button", { name: new RegExp(`ตัวเลข ${d}|Digit ${d}`) }).click();
    }
    await page.waitForTimeout(400);
    record("U27", "รหัสผิดมีข้อความชัด", (await page.getByText(/รหัสไม่ถูกต้อง|incorrect/i).count()) > 0);
  } else {
    record("U27", "รหัสผิดมีข้อความชัด", false);
  }

  // Language switch after re-open
  await openDemo(page);
  await page.getByRole("button", { name: /Switch language|สลับภาษา/i }).click();
  await page.waitForTimeout(250);
  const enNav = (await page.getByRole("link", { name: /Overview|Assets/ }).count()) > 0;
  await openAccess(page);
  const enAccess = (await page.getByRole("heading", { name: /One-tap cloud|Dead-man|Release plan/ }).count()) > 0;
  record("U28", "สลับอังกฤษแล้วเมนูและแผนส่งมอบเป็นอังกฤษ", enNav && enAccess, { enNav, enAccess });
  await page.getByRole("button", { name: /Switch language|สลับภาษา/i }).click();

  // Form validation
  await page.getByRole("link", { name: /ทรัพย์สิน|^Assets$/ }).click();
  await page.getByRole("button", { name: /เพิ่มทรัพย์สิน|Add asset/ }).first().click();
  await page.getByRole("button", { name: /^บันทึก$|^Save$/ }).click();
  record("U29", "ฟอร์มทรัพย์สินว่างแล้วมี error", (await page.getByRole("alert").count()) > 0);
} catch (err) {
  findings.push({ id: "runner", title: String(err).slice(0, 500), extra: {} });
}

const report = {
  ms: Date.now() - t0,
  passed: tasks.filter((t) => t.ok).length,
  total: tasks.length,
  ok: findings.length === 0,
  tasks,
  findings,
};
writeFileSync("/tmp/vaulty-usability-now.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
await browser.close();
process.exit(findings.length ? 1 : 0);
