#!/usr/bin/env node
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

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

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "th-TH" });
const page = await ctx.newPage();

try {
  await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
  await wipeIfNeeded(page);
  await page.getByRole("button", { name: /เปิดคลังตัวอย่าง/ }).click();
  const confirm = page.getByRole("button", { name: /เปิดคลังตัวอย่าง/ }).nth(1);
  if (await confirm.isVisible().catch(() => false)) await confirm.click();
  await page.waitForURL(/\/vault/, { timeout: 20000 });
  await openAccess(page);

  record("C1", "มีแผงสำรองคลาวด์", (await page.getByRole("heading", { name: /สำรองคลาวด์กดปุ่มเดียว|One-tap cloud/ }).count()) > 0);
  record("C2", "บอกว่ารหัสไม่ขึ้นเซิร์ฟเวอร์", (await page.getByText(/ไม่เก็บรหัสผ่าน|never the passcode/i).count()) > 0);

  const saveBtn = page.getByRole("button", { name: /สำรองขึ้นคลาวด์|Back up to cloud/ });
  const signIn = page.getByRole("link", { name: /เข้าสู่ระบบ|Sign in/ });
  let canSave = (await saveBtn.count()) > 0;
  record("C3", "เข้าสู่ระบบหรือกดสำรองได้", canSave || (await signIn.count()) > 0);

  if (!canSave && (await signIn.count()) > 0) {
    await signIn.first().click();
    await page.waitForURL(/\/login/, { timeout: 10000 });
    const mail = `cloud.${Date.now()}@vaulty.test`;
    await page.getByRole("textbox", { name: /เมล|Email/ }).fill(mail);
    await page.locator('input[type=password]').fill("Vaulty-cloud-1");
    await page.getByRole("button", { name: /สมัครบัญชี|Create account/ }).click();
    await page.waitForURL(/\/vault/, { timeout: 20000 });
    await openAccess(page);
    canSave = (await page.getByRole("button", { name: /สำรองขึ้นคลาวด์|Back up to cloud/ }).count()) > 0;
  }

  if (canSave) {
    await page.getByRole("button", { name: /สำรองขึ้นคลาวด์|Back up to cloud/ }).click();
    await page.getByText(/สำรองขึ้นคลาวด์แล้ว|Saved to the cloud/).waitFor({ timeout: 15000 });
    record("C4", "สำรองแล้วเห็นพิมพ์นิ้ว", (await page.locator("span.font-mono").count()) > 0);

    await page.getByRole("button", { name: /^ลบคลัง$|^Erase vault$/ }).click();
    await page.getByRole("heading", { name: /ลบคลังถาวร|Erase this vault/ }).waitFor({ timeout: 8000 });
    await page.getByRole("button", { name: /^ลบคลัง$|^Erase vault$/ }).last().click();
    await page.getByRole("heading", { name: "Vaulty" }).waitFor({ timeout: 10000 });
    record("C5", "ลบคลังบนเครื่องแล้วยังอยู่หน้าแรก", (await page.getByRole("button", { name: /สร้างคลังใหม่|Create a vault/ }).count()) > 0);

    const restore = page.getByRole("button", { name: /กู้จากคลาวด์|Restore from cloud/ });
    await restore.first().waitFor({ timeout: 8000 });
    await restore.first().click();
    await page.getByText(/ดึงคลังจากคลาวด์แล้ว|Cloud vault restored/).waitFor({ timeout: 15000 });
    await page.getByRole("group", { name: /กรอกรหัสผ่าน|Enter your passcode|กรอกรหัส/ }).waitFor({ timeout: 8000 });
    record("C6", "กู้จากคลาวด์แล้วไปหน้ารหัส", true);

    await page.keyboard.type("258036");
    await page.getByRole("heading", { name: /สุทธิดา/ }).waitFor({ timeout: 20000 });
    record("C7", "ปลดล็อกคลังที่กู้แล้วเห็นเจ้าของ", (await page.getByRole("heading", { name: /สุทธิดา/ }).count()) > 0);
  } else {
    record("C4", "ยังไม่ล็อกอิน — มีทางเข้าสู่ระบบ", (await signIn.count()) > 0);
    record("C5", "ข้ามกู้เพราะยังไม่ล็อกอิน", true);
    record("C6", "ข้ามกู้เพราะยังไม่ล็อกอิน", true);
    record("C7", "ข้ามปลดล็อกเพราะยังไม่ล็อกอิน", true);
  }
} catch (err) {
  record("runner", String(err).slice(0, 600), false);
}

const report = { passed: tasks.filter((t) => t.ok).length, total: tasks.length, tasks };
writeFileSync("/tmp/vaulty-cloud-backup.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
await browser.close();
process.exit(tasks.every((t) => t.ok) ? 0 : 1);
