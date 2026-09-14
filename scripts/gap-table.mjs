#!/usr/bin/env node
import { chromium } from "playwright";
import { writeFileSync, readFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const url = process.env.GAP_URL || "http://127.0.0.1:8080/";
const tasks = [];
const findings = [];
const dir = mkdtempSync(join(tmpdir(), "vaulty-gap-"));

function record(id, title, ok, extra = {}) {
  tasks.push({ id, title, ok, ...extra });
  if (!ok) findings.push({ id, title, extra });
}

async function clickDigits(page, pin) {
  for (const d of pin.split("")) {
    await page.getByRole("button", { name: new RegExp(`ตัวเลข ${d}|Digit ${d}`) }).click();
  }
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

async function passRecovery(page) {
  await page.getByRole("heading", { name: /สำรองคลังก่อนใช้งาน|Back up the vault first/i }).waitFor({ timeout: 20000 });
  const gate = page.getByRole("dialog");
  await Promise.all([page.waitForEvent("download", { timeout: 15000 }), gate.getByRole("button", { name: /ส่งออกตอนนี้|Export now/i }).click()]);
  await Promise.all([page.waitForEvent("download", { timeout: 15000 }), gate.getByRole("button", { name: /พิมพ์การ์ดรหัส|Print key card/i }).click()]);
  await gate.getByRole("button", { name: /ฉันเก็บไฟล์และเขียนรหัสแล้ว|I have stored/i }).click();
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

async function openDocs(page) {
  await page.keyboard.press("Escape").catch(() => {});
  await page.waitForTimeout(200);
  const more = page.getByRole("button", { name: /เพิ่มเติม|^More$/i });
  if (await more.isVisible()) {
    await more.click();
    const link = page.getByRole("link", { name: /^เอกสาร$|^Documents$/ });
    if (await link.count()) {
      await link.last().click();
      await page.waitForTimeout(400);
      return;
    }
  }
  await page.goto(new URL("/vault/docs", url).href, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(400);
}

async function lockVault(page) {
  const more = page.getByRole("button", { name: /เพิ่มเติม|^More$/i });
  if (await more.isVisible()) {
    await more.click();
    await page.getByRole("button", { name: /ล็อกคลัง|^Lock$/i }).last().click();
  } else {
    await page.getByRole("button", { name: /ล็อกคลัง|^Lock$/i }).last().click();
  }
  await page.waitForTimeout(500);
}

const browser = await chromium.launch({ headless: true });
let familyHtml = "";
let kitHtml = "";
let kitPath = "";
const SECRET_MARKERS = ["YubiKey", "seed เก็บแยก", "Chiang Mai house", "Apple Passwords"];

try {
  const ctxA = await browser.newContext({ viewport: { width: 1280, height: 800 }, locale: "th-TH", acceptDownloads: true });
  const page = await ctxA.newPage();
  await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
  await wipeIfNeeded(page);

  await page.getByRole("button", { name: /สร้างคลังใหม่|Create a vault/i }).click();
  await page.getByPlaceholder(/ชื่อ-นามสกุล|Full name/i).fill("จิรวัฒน์ ทดลอง");
  await page.getByRole("button", { name: /ดำเนินการต่อ|Continue/i }).click();
  await page.getByRole("button", { name: /ใช้ประโยคผ่าน|Use a passphrase/i }).click();
  await page.getByLabel(/ประโยคผ่าน|Passphrase/i).fill("บ้านเชียงใหม่58");
  await page.getByRole("button", { name: /ดำเนินการต่อ|Continue/i }).click();
  await page.getByLabel(/ยืนยันประโยคผ่าน|Confirm passphrase/i).fill("บ้านเชียงใหม่58");
  await page.getByRole("button", { name: /สร้างคลังใหม่|Create a vault/i }).click();
  await passRecovery(page);
  await page.getByRole("heading", { name: /จิรวัฒน์ ทดลอง/i }).waitFor({ timeout: 15000 });
  record("P1", "สร้างคลังด้วยประโยคผ่านแล้วเข้าคลังได้", true);

  await lockVault(page);
  await page.getByRole("button", { name: /ใช้ประโยคผ่าน|Use a passphrase/i }).click();
  await page.locator('input[type=password]').fill("บ้านเชียงใหม่58");
  await page.getByRole("button", { name: /^เปิดคลัง$|^Unlock$|^Open vault$/ }).last().click();
  const phraseUnlock = await page.waitForURL(/\/vault/, { timeout: 20000 }).then(() => true).catch(() => false);
  record("P2", "ปลดล็อกด้วยประโยคผ่าน", phraseUnlock);
  await ctxA.close();

  const ctxPin = await browser.newContext({ viewport: { width: 1280, height: 800 }, locale: "th-TH", acceptDownloads: true });
  const p = await ctxPin.newPage();
  await p.goto(url, { waitUntil: "networkidle", timeout: 45000 });
  await wipeIfNeeded(p);
  await p.getByRole("button", { name: /สร้างคลังใหม่|Create a vault/i }).click();
  await p.getByPlaceholder(/ชื่อ-นามสกุล|Full name/i).fill("ทดสอบ กู้คืน");
  await p.getByRole("button", { name: /ดำเนินการต่อ|Continue/i }).click();
  await clickDigits(p, "147258");
  await clickDigits(p, "147258");
  await p.getByRole("heading", { name: /สำรองคลังก่อนใช้งาน|Back up the vault first/i }).waitFor({ timeout: 20000 });
  const gate = p.getByRole("dialog");
  const [oldBackup] = await Promise.all([
    p.waitForEvent("download", { timeout: 15000 }),
    gate.getByRole("button", { name: /ส่งออกตอนนี้|Export now/i }).click(),
  ]);
  const oldJson = join(dir, "old-sealed.json");
  await oldBackup.saveAs(oldJson);
  await Promise.all([p.waitForEvent("download", { timeout: 15000 }), gate.getByRole("button", { name: /พิมพ์การ์ดรหัส|Print key card/i }).click()]);
  await gate.getByRole("button", { name: /ฉันเก็บไฟล์และเขียนรหัสแล้ว|I have stored/i }).click();
  await p.getByRole("heading", { name: /ทดสอบ กู้คืน/i }).waitFor({ timeout: 15000 });

  await openAccess(p);
  await clickDigits(p, "258147");
  await clickDigits(p, "258147");
  await p.waitForTimeout(1000);
  await lockVault(p);
  await clickDigits(p, "147258");
  await p.waitForTimeout(800);
  const oldPinRejected = (await p.getByText(/รหัสไม่ถูกต้อง|incorrect/i).count()) > 0 && !p.url().includes("/vault");
  record("G3", "หลังเปลี่ยนรหัส รหัสเก่าเปิดคลังบนเครื่องนี้ไม่ได้", oldPinRejected);
  await clickDigits(p, "258147");
  const newPinOk = await p.waitForURL(/\/vault/, { timeout: 20000 }).then(() => true).catch(() => false);
  record("G4", "รหัสใหม่เปิดคลังบนเครื่องนี้ได้", newPinOk);
  await ctxPin.close();

  const ctxBlank = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "th-TH", acceptDownloads: true });
  const blank = await ctxBlank.newPage();
  await blank.goto(url, { waitUntil: "networkidle", timeout: 45000 });
  await wipeIfNeeded(blank);
  await blank.getByRole("button", { name: /กู้คืนจากไฟล์|Restore from file/i }).click();
  await blank.locator('input[type=file][accept*="json"]').setInputFiles(oldJson);
  await blank.waitForTimeout(800);
  await clickDigits(blank, "147258");
  const restored = await blank.waitForURL(/\/vault/, { timeout: 20000 }).then(() => true).catch(() => false);
  record("R1", "กู้จาก vaulty-sealed.json บนเครื่องเปล่าด้วยรหัสตอนส่งออก", restored, { url: blank.url() });
  await ctxBlank.close();

  const ctxBlank2 = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "th-TH" });
  const b2 = await ctxBlank2.newPage();
  await b2.goto(url, { waitUntil: "networkidle", timeout: 45000 });
  await wipeIfNeeded(b2);
  await b2.getByRole("button", { name: /กู้คืนจากไฟล์|Restore from file/i }).click();
  await b2.locator('input[type=file][accept*="json"]').setInputFiles(oldJson);
  await b2.waitForTimeout(600);
  await clickDigits(b2, "258147");
  await b2.waitForTimeout(900);
  const newPinOnOldBackup = b2.url().includes("/vault");
  record("G5", "สำรองเก่าเปิดด้วยรหัสใหม่ไม่ได้", !newPinOnOldBackup);
  await ctxBlank2.close();

  const ctxD = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "th-TH", acceptDownloads: true });
  const d = await ctxD.newPage();
  await d.goto(url, { waitUntil: "networkidle", timeout: 45000 });
  await wipeIfNeeded(d);
  await d.getByRole("button", { name: /เปิดคลังตัวอย่าง/ }).click();
  const confirm = d.getByRole("button", { name: /เปิดคลังตัวอย่าง/ }).nth(1);
  if (await confirm.isVisible().catch(() => false)) await confirm.click();
  await d.waitForURL(/\/vault/, { timeout: 20000 });

  await openAccess(d);
  const [kitDl] = await Promise.all([
    d.waitForEvent("download", { timeout: 20000 }),
    d.getByRole("button", { name: /ดาวน์โหลดชุดผู้จัดการมรดก|Download executor/i }).click(),
  ]);
  kitPath = join(dir, "vaulty-executor-kit.html");
  await kitDl.saveAs(kitPath);
  kitHtml = readFileSync(kitPath, "utf8");

  const [famDl] = await Promise.all([
    d.waitForEvent("download", { timeout: 20000 }),
    d.getByRole("button", { name: /ดาวน์โหลดทุกชุดทายาท|Download all family|family pack/i }).click(),
  ]);
  familyHtml = readFileSync(await famDl.path(), "utf8");

  const familyHasSecret = SECRET_MARKERS.some((s) => familyHtml.includes(s));
  const kitHasPlain = SECRET_MARKERS.some((s) => kitHtml.includes(s));
  record("F1", "ชุดครอบครัวตัดรหัสลับออก", !familyHasSecret, { familyHasSecret });
  record("F2", "ชุดผู้จัดการมรดกไม่มีรหัสลับเป็นข้อความล้วนก่อนถอดรหัส", !kitHasPlain && /AES-GCM|PBKDF2/.test(kitHtml), { kitHasPlain });

  await d.getByRole("link", { name: /^ทายาท$|^Heirs$/ }).click();
  await d.waitForTimeout(400);
  await d.getByRole("button", { name: /ดูชุดเอกสารทายาท|Preview heir/i }).first().click();
  await d.waitForTimeout(400);
  const closeX = d.getByRole("button", { name: /ปิดตัวอย่าง|Close preview/i });
  const printBtn = d.getByRole("button", { name: /พิมพ์แพ็กเก็ต|Print packet/i });
  const dlFam = d.getByRole("button", { name: /ดาวน์โหลดชุดครอบครัว|Download family pack/i });
  record("H1", "ชุดทายาทมีปุ่มปิดแบบ X และพิมพ์/ดาวน์โหลด", (await closeX.count()) > 0 && (await printBtn.count()) > 0 && (await dlFam.count()) > 0);
  const [onePack] = await Promise.all([d.waitForEvent("download", { timeout: 15000 }), dlFam.click()]);
  const onePackHtml = readFileSync(await onePack.path(), "utf8");
  record("F3", "ชุดทายาทรายคนก็ตัดรหัสลับ", !SECRET_MARKERS.some((s) => onePackHtml.includes(s)));
  await closeX.click();

  await d.getByRole("link", { name: /ความประสงค์|^Wishes$/ }).click();
  await d.waitForTimeout(400);
  record("L1", "เห็นจดหมายตัวอย่าง", (await d.getByText("ถึงวิชญ์").count()) > 0);
  await d.getByRole("button", { name: /อ่านจดหมาย|Read letter/i }).first().click();
  record("L2", "เปิดอ่านจดหมายแล้วเห็นเนื้อความ", (await d.getByText(/กุญแจตู้เซฟ|tea tin/i).count()) > 0);
  await d.getByRole("button", { name: /เขียนจดหมาย|Write a letter/i }).click();
  const letterDlg = d.getByRole("dialog");
  await letterDlg.waitFor({ timeout: 8000 });
  const combo = letterDlg.getByRole("combobox");
  if (await combo.count()) {
    const shown = ((await combo.textContent()) || "").trim();
    if (!shown || /เลือก|Select/i.test(shown)) {
      await combo.click();
      await d.getByRole("option").first().click();
    }
  }
  await letterDlg.getByLabel(/หัวข้อ|^Title$/).fill("ข้อความทดลอง");
  await letterDlg.getByLabel(/เนื้อหา|^Letter$/).fill("ถึงลูก เก็บสำเนานี้ไว้กับทนาย");
  await letterDlg.getByRole("button", { name: /^บันทึก$|^Save$/ }).click();
  await d.waitForTimeout(700);
  const dlgStill = await letterDlg.isVisible().catch(() => false);
  const letterSaved = (await d.getByText("ข้อความทดลอง").count()) > 0 && !dlgStill;
  record("L3", "เขียนจดหมายใหม่แล้วขึ้นรายการ", letterSaved, {
    dlgStill,
    dlgText: dlgStill ? (await letterDlg.innerText()).slice(0, 280) : "",
  });
  if (dlgStill) await d.keyboard.press("Escape");
  await d.waitForTimeout(200);
  if (letterSaved) {
    const row = d.locator("li").filter({ hasText: "ข้อความทดลอง" });
    await row.getByRole("button").last().click();
    await d.waitForTimeout(400);
    record("L4", "ลบจดหมายแล้วหายจากรายการ", (await d.getByText("ข้อความทดลอง").count()) === 0);
  } else {
    record("L4", "ลบจดหมายแล้วหายจากรายการ", false, { skipped: "no letter to delete" });
  }

  await openDocs(d);
  await d.getByRole("button", { name: /เพิ่มเอกสาร|Add document/i }).first().click();
  await d.getByRole("dialog").locator("input").first().fill("ไฟล์ทดสอบ");
  const file = d.locator('input[type=file]');
  await file.setInputFiles({ name: "virus.exe", mimeType: "application/x-msdownload", buffer: Buffer.alloc(100) });
  await d.waitForTimeout(500);
  const typeErr = await d.getByText(/PDF|350|ชนิด|ประเภท|errFileType/i).count();
  await file.setInputFiles({ name: "huge.txt", mimeType: "text/plain", buffer: Buffer.alloc(400_000, 97) });
  await d.waitForTimeout(500);
  const sizeErr = await d.getByText(/PDF|350|ไม่เกิน/i).count();
  record("D1", "ไฟล์ผิดประเภทถูกปฏิเสธ", typeErr > 0);
  record("D2", "ไฟล์เกิน 350KB ถูกปฏิเสธ", sizeErr > 0);
  await d.keyboard.press("Escape");

  await d.getByRole("button", { name: /สลับภาษา|Switch language/i }).click();
  await d.waitForTimeout(300);
  const assetsEn = await d.getByRole("link", { name: /Assets/ }).count();
  const heirsEn = await d.getByRole("link", { name: /Heirs/ }).count();
  const wishesEn = await d.getByRole("link", { name: /Wishes/ }).count();
  record("E1", "สลับอังกฤษแล้วเมนูหลักเป็นอังกฤษ", assetsEn + heirsEn + wishesEn >= 2, { assetsEn, heirsEn, wishesEn });
  if (assetsEn) await d.getByRole("link", { name: /Assets/ }).click();
  const assetsHead = await d.getByRole("heading", { name: /Assets/ }).count();
  record("E2", "หน้าทรัพย์สินเป็นอังกฤษ", assetsHead > 0);

  await d.evaluate(() => {
    document.documentElement.style.fontSize = "32px";
  });
  await d.waitForTimeout(300);
  const overflow = await d.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 8);
  const navBoxes = [];
  for (const el of await d.locator("nav.fixed a, nav.fixed button").all()) {
    navBoxes.push(await el.boundingBox());
  }
  const vw = 390;
  const navOnScreen = navBoxes.filter(Boolean).filter((b) => b.x >= -2 && b.x + b.width <= vw + 2);
  record("Z1", "ขยายตัวอักษร 200% แถบล่างยังกดได้", navOnScreen.length >= 4 && navOnScreen.every((b) => b.height >= 36), { navOnScreen, overflow });
  record("Z2", "ขยายตัวอักษร 200% แถบล่างไม่หลุดจอ", navOnScreen.length >= 4, { overflow, count: navOnScreen.length });
  await d.evaluate(() => {
    document.documentElement.style.fontSize = "";
  });

  await d.getByRole("button", { name: /Switch language|สลับภาษา/i }).click().catch(() => {});
  const d2 = await ctxD.newPage();
  await d2.goto(url, { waitUntil: "networkidle", timeout: 45000 });
  await clickDigits(d2, "258036");
  await d2.waitForURL(/\/vault/, { timeout: 20000 }).catch(() => {});
  await d.waitForTimeout(900);
  const readonly = await d.getByText(/อ่านอย่างเดียว|read-only|แท็บอื่น/i).count();
  record("T1", "แท็บสองเปิดแล้วแท็บแรกเป็นอ่านอย่างเดียว", readonly > 0, { readonly, url1: d.url(), url2: d2.url() });
  await d2.close();

  await lockVault(d);
  for (let i = 0; i < 5; i++) {
    await clickDigits(d, "000000");
    await d.waitForTimeout(700);
  }
  const lockedOut = await d.getByText(/ลองใหม่ใน|Try again in/i).count();
  record("K1", "ใส่รหัสผิด 5 ครั้งแล้วถูกล็อกชั่วคราว", lockedOut > 0);
  await ctxD.close();

  const fileUrl = pathToFileURL(kitPath).href;
  const ctxF = await browser.newContext();
  const f = await ctxF.newPage();
  let fileOpen = false;
  let fileSecure = false;
  let fileUnlocked = false;
  let fileMsg = "";
  try {
    await f.goto(fileUrl, { waitUntil: "domcontentloaded", timeout: 10000 });
    fileOpen = true;
    fileSecure = await f.evaluate(() => Boolean(window.isSecureContext && crypto.subtle));
    fileMsg = (await f.locator("#err").textContent()) || "";
    if (fileSecure) {
      await f.locator("#secret").fill("258036");
      await f.locator("#gate").evaluate((form) => form.requestSubmit());
      await f.locator("#view").waitFor({ state: "visible", timeout: 15000 });
      fileUnlocked = await f.locator("#view").isVisible();
    }
  } catch (err) {
    fileMsg = String(err).slice(0, 200);
  }
  record("C1", "เปิดชุดจากไฟล์ใน Chrome แล้วถอดรหัสได้", fileOpen && fileSecure && fileUnlocked, { fileOpen, fileSecure, fileUnlocked, fileMsg });
  await ctxF.close();
} catch (err) {
  findings.push({ id: "runner", title: String(err).slice(0, 700) });
}

const report = {
  passed: tasks.filter((t) => t.ok).length,
  total: tasks.length,
  ok: findings.filter((f) => f.id === "runner").length === 0 && tasks.every((t) => t.ok),
  tasks,
  findings,
};
writeFileSync("/tmp/vaulty-gap-table.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
await browser.close();
process.exit(0);
