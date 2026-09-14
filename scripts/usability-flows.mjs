#!/usr/bin/env node
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const url = process.env.GAP_URL || "http://127.0.0.1:8080/";
const tasks = [];
const findings = [];

function record(id, title, ok, extra = {}) {
  tasks.push({ id, title, ok, ...extra });
}

function find(severity, area, issue, evidence) {
  findings.push({ severity, area, issue, evidence });
}

async function tapBox(locator) {
  const box = await locator.boundingBox().catch(() => null);
  return box;
}

async function clickDigits(page, pin) {
  for (const d of pin.split("")) {
    await page.getByRole("button", { name: new RegExp(`ตัวเลข ${d}|Digit ${d}`) }).click();
  }
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  locale: "th-TH",
  acceptDownloads: true,
});
const page = await context.newPage();
const t0 = Date.now();

try {
  await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(400);

  const forgot = page.getByRole("button", { name: /ลืมรหัส|forgot/i });
  if (await forgot.count()) {
    await forgot.click();
    await page.getByRole("heading", { name: /ลบคลังถาวร|Erase this vault/i }).waitFor({ timeout: 8000 });
    await page.getByRole("alertdialog").getByRole("button", { name: /^ลบคลัง$|^Erase vault$/ }).click({ force: true });
    await page.getByRole("heading", { name: "Vaulty" }).waitFor({ timeout: 8000 });
  }

  // T1 Welcome
  const create = page.getByRole("button", { name: /สร้างคลังใหม่/ });
  const demo = page.getByRole("button", { name: /เปิดคลังตัวอย่าง/ });
  const restore = page.getByRole("button", { name: /กู้คืน|Restore/i });
  const welcomeOk = (await create.isVisible()) && (await demo.isVisible()) && (await restore.isVisible());
  record("T1", "หน้าแรกแยกสร้าง / ตัวอย่าง / กู้คืน ได้", welcomeOk);
  if (!welcomeOk) find("high", "gate", "ปุ่มหลักบนหน้าแรกไม่ครบ", "create/demo/restore");

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
  );
  record("T1b", "หน้าแรกไม่ล้นแนวนอน", !overflow);
  if (overflow) find("high", "layout", "หน้าแรกล้นแนวนอน", "scrollWidth");

  // T2 Open demo
  const s2 = Date.now();
  await demo.click();
  const confirmDemo = page.getByRole("button", { name: /เปิดคลังตัวอย่าง/ }).nth(1);
  if (await confirmDemo.isVisible().catch(() => false)) await confirmDemo.click();
  const inVault = await page.waitForURL(/\/vault/, { timeout: 20000 }).then(() => true).catch(() => false);
  record("T2", "เปิดคลังตัวอย่างถึงภาพรวม", inVault, { ms: Date.now() - s2 });
  if (!inVault) find("critical", "demo", "เปิดคลังตัวอย่างไม่ถึงภาพรวม", "url");

  await page.waitForTimeout(500);
  const netWorth = await page.getByText(/มูลค่าทรัพย์สินรวม|Net worth/i).count();
  record("T3", "เห็นมูลค่าทรัพย์สินรวมทันที", netWorth > 0);
  if (!netWorth) find("high", "overview", "ภาพรวมไม่มีมูลค่ารวม", "missing net worth");

  const navLabels = await page.locator("nav[aria-label='เมนูล่าง'] a, nav[aria-label='เมนูล่าง'] button").allTextContents();
  record("T4", "แถบล่างมีป้ายภาษาไทยรวมเพิ่มเติม", navLabels.length >= 5 && navLabels.some((l) => /เพิ่มเติม/.test(l)), { navLabels });
  const tiny = [];
  for (const link of await page.locator("nav[aria-label='เมนูล่าง'] a, nav[aria-label='เมนูล่าง'] button").all()) {
    const box = await tapBox(link);
    if (box && (box.height < 40 || box.width < 44)) tiny.push(box);
  }
  record("T4b", "เป้าสัมผัสแถบล่าง ≥ 40px", tiny.length === 0, { tiny });
  if (tiny.length) find("high", "nav", "แถบล่างเป้าสัมผัสเล็กเกิน", JSON.stringify(tiny));

  const docsInBar = navLabels.some((l) => /เอกสาร/.test(l));
  const moreInBar = navLabels.some((l) => /เพิ่มเติม/.test(l));
  record("T5", "หาเอกสารได้จากแถบล่างหรือปุ่มเพิ่มเติมที่เห็นชัด", docsInBar || moreInBar, {
    docsInBar,
    moreInBar,
  });
  if (!docsInBar && !moreInBar) {
    find(
      "high",
      "ia",
      "เอกสารไม่อยู่ในแถบล่าง และไม่มีปุ่มเพิ่มเติมให้เห็น",
      navLabels.join(", "),
    );
  }

  const s5 = Date.now();
  let foundDocs = docsInBar;
  if (!docsInBar && moreInBar) {
    await page.getByRole("button", { name: /เพิ่มเติม/ }).click();
    const docsLink = page.getByRole("link", { name: /^เอกสาร$/ });
    foundDocs = await docsLink.isVisible();
    record("T5b", "เอกสารอยู่ในแผงเพิ่มเติม", foundDocs, { ms: Date.now() - s5 });
    if (foundDocs) await docsLink.click();
    else await page.keyboard.press("Escape");
  } else if (docsInBar) {
    await page.getByRole("link", { name: /^เอกสาร$/ }).click();
  }
  await page.waitForTimeout(400);
  const onDocs = page.url().includes("/docs") || (await page.getByRole("heading", { name: /เอกสาร/ }).count()) > 0;
  record("T6", "เข้าหน้าเอกสารได้", onDocs, { url: page.url() });
  if (!onDocs) find("high", "docs", "เข้าหน้าเอกสารไม่สำเร็จ", page.url());

  // T7 Add document validation
  if (onDocs) {
    await page.getByRole("button", { name: /เพิ่มเอกสาร/ }).first().click();
    await page.waitForTimeout(300);
    await page.getByRole("button", { name: /^บันทึก$/ }).click();
    const nameError = await page.getByRole("alert").count();
    record("T7", "เอกสารว่างแล้วบันทึกมีข้อความผิด", nameError > 0, { alerts: nameError });
    if (!nameError) find("medium", "forms", "ฟอร์มเอกสารไม่บอกว่าต้องมีชื่อ", "no alert");
    await page.getByRole("button", { name: /ยกเลิก/ }).click().catch(() => page.keyboard.press("Escape"));
  }

  // T8 Assets: add with empty name
  await page.getByRole("link", { name: /ทรัพย์สิน/ }).click();
  await page.waitForTimeout(400);
  const addAsset = page.getByRole("button", { name: /เพิ่มทรัพย์สิน/ }).first();
  await addAsset.click();
  await page.waitForTimeout(300);
  const dialogTitle = await page.getByRole("heading", { name: /เพิ่มทรัพย์สิน/ }).isVisible();
  record("T8", "เปิดไดอะล็อกเพิ่มทรัพย์สิน", dialogTitle);
  await page.getByRole("button", { name: /^บันทึก$/ }).click();
  const assetErr = await page.getByRole("alert").allTextContents();
  record("T8b", "ไม่กรอกชื่อแล้วมี error", assetErr.length > 0, { assetErr });
  if (!assetErr.length) find("high", "forms", "เพิ่มทรัพย์สินว่างแล้วยังไม่เตือน", "no aria alert");

  const nameField = page.getByRole("dialog").getByLabel(/ชื่อ/);
  if (await nameField.count()) {
    await nameField.fill("บัญชีทดลอง");
    await page.getByRole("button", { name: /^บันทึก$/ }).click();
    await page.waitForTimeout(400);
    const saved = await page.getByText("บัญชีทดลอง").count();
    record("T8c", "บันทึกทรัพย์สินแล้วเห็นในรายการ", saved > 0);
    if (!saved) find("high", "assets", "บันทึกแล้วไม่เห็นรายการ", "missing บัญชีทดลอง");
  } else {
    record("T8c", "บันทึกทรัพย์สินแล้วเห็นในรายการ", false);
    find("high", "forms", "ช่องชื่อในไดอะล็อกหาไม่เจอด้วย label", "no labeled name");
  }

  // T9 Heirs
  await page.getByRole("link", { name: /^ทายาท$/ }).click();
  await page.waitForTimeout(400);
  const heirHeading = await page.getByRole("heading", { name: /ทายาท/ }).count();
  record("T9", "หน้าทายาทมีหัวข้อและสรุปสัดส่วน", heirHeading > 0);

  // T10 Language
  await page.getByRole("button", { name: /Switch language|สลับภาษา/i }).click();
  await page.waitForTimeout(200);
  const en = await page.getByRole("link", { name: /Overview|Assets/ }).count();
  await page.getByRole("button", { name: /Switch language|สลับภาษา/i }).click();
  record("T10", "สลับ EN/TH แล้วเมนูตามภาษา", en > 0);

  // T11 Handoff from more or access
  const s11 = Date.now();
  await page.getByRole("button", { name: /เพิ่มเติม/ }).click().catch(() => {});
  await page.waitForTimeout(200);
  const accessLink = page.getByRole("link", { name: /แผนส่งมอบ/ });
  if (await accessLink.isVisible()) await accessLink.click();
  else await page.goto(url.replace(/\/$/, "") + "/vault/access", { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  const kit = page.getByRole("button", { name: /ดาวน์โหลดชุดผู้จัดการมรดก|Download executor/i });
  const kitVisible = await kit.isVisible().catch(() => false);
  record("T11", "หาปุ่มชุดผู้จัดการมรดกได้", kitVisible, { ms: Date.now() - s11 });
  if (!kitVisible) find("high", "handoff", "ปุ่มดาวน์โหลดชุดผู้จัดการมรดกไม่โผล่", page.url());

  // T12 Lock
  await page.getByRole("button", { name: /เพิ่มเติม/ }).click().catch(() => {});
  await page.waitForTimeout(200);
  const lockBtn = page.getByRole("button", { name: /ล็อกคลัง/ });
  if (await lockBtn.isVisible()) {
    await lockBtn.click();
    await page.waitForTimeout(400);
    const locked = await page.getByRole("button", { name: /ลืมรหัส|forgot/i }).count();
    record("T12", "ล็อกคลังแล้วกลับหน้ากรอกรหัส", locked > 0);
  } else {
    record("T12", "ล็อกคลังแล้วกลับหน้ากรอกรหัส", false);
    find("medium", "lock", "ปุ่มล็อกคลังหาไม่เจอบนมือถือ", "not in more sheet");
  }

  // T13 Wrong PIN
  if (page.url().includes("/") || (await page.getByText(/กรอกรหัส|Enter PIN/i).count())) {
    await clickDigits(page, "000000");
    await page.waitForTimeout(400);
    const wrong = await page.getByText(/รหัสไม่ถูกต้อง|incorrect/i).count();
    record("T13", "รหัสผิดมีข้อความชัด", wrong > 0);
    if (!wrong) find("medium", "gate", "รหัสผิดไม่บอกผู้ใช้", "no wrongPin copy");
  }

  // T14 Create vault validation
  const forgot2 = page.getByRole("button", { name: /ลืมรหัส|forgot/i });
  if (await forgot2.count()) {
    await forgot2.click();
    await page.getByRole("heading", { name: /ลบคลังถาวร|Erase this vault/i }).waitFor({ timeout: 8000 });
    await page.getByRole("alertdialog").getByRole("button", { name: /^ลบคลัง$|^Erase vault$/ }).click({ force: true });
    await page.getByRole("heading", { name: "Vaulty" }).waitFor({ timeout: 8000 });
  }
  await page.getByRole("button", { name: /สร้างคลังใหม่/ }).click();
  await page.getByRole("button", { name: /ดำเนินการต่อ/ }).click();
  const nameReq = await page.getByRole("alert").count();
  record("T14", "สร้างคลังไม่กรอกชื่อแล้วมี error", nameReq > 0);
  if (!nameReq) find("medium", "onboarding", "ข้ามชื่อเจ้าของคลังได้โดยไม่มีเตือน", "no alert");

  // T15 Recovery gate after create
  await page.getByPlaceholder(/ชื่อ-นามสกุล/).fill("ทดสอบ ใช้ได้");
  await page.getByRole("button", { name: /ดำเนินการต่อ/ }).click();
  await clickDigits(page, "147258");
  await clickDigits(page, "147258");
  const gate = await page.getByRole("heading", { name: /สำรองคลังก่อนใช้งาน|Back up the vault first/i }).waitFor({ timeout: 20000 }).then(() => true).catch(() => false);
  record("T15", "สร้างคลังจริงแล้วบังคับสำรองก่อนเข้า", gate);
  if (!gate) find("critical", "recovery", "สร้างคลังแล้วไม่เจอประตูสำรอง", "no recovery gate");
} catch (err) {
  findings.push({ severity: "critical", area: "runner", issue: "สคริปต์สะดุด", evidence: String(err).slice(0, 400) });
}

const passed = tasks.filter((t) => t.ok).length;
const report = {
  ms: Date.now() - t0,
  passed,
  total: tasks.length,
  ok: findings.filter((f) => f.severity === "critical").length === 0,
  tasks,
  findings,
};
writeFileSync("/tmp/vaulty-usability.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
await browser.close();
process.exit(0);
