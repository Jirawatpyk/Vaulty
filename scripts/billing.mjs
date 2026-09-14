#!/usr/bin/env node
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";
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

  const panel = await page.locator("#billing").innerText();
  record("B1", "แผงแพ็กเกจบอกว่าโหมดทดสอบและยังไม่จดบริษัท", /โหมดทดสอบ|ยังไม่จด/.test(panel));
  record("B2", "บอกว่าไม่เก็บเงินจริง", /ไม่เก็บเงินจริง|ไม่ตัดบัตร/.test(panel));
  record("B3", "มีแพ็กเกจครอบครัว มรดก สำนักงาน", /ครอบครัว/.test(panel) && /มรดก/.test(panel) && /สำนักงาน/.test(panel));

  const signIn = page.getByRole("link", { name: /เข้าสู่ระบบ|Sign in/ });
  if (await signIn.count()) {
    await signIn.first().click();
    await page.waitForURL(/\/login/, { timeout: 10000 });
    await page.locator("#consent-account").check();
    const mail = `bill.${Date.now()}@vaulty.test`;
    await page.getByRole("textbox", { name: /เมล|Email/ }).fill(mail);
    await page.locator("input[type=password]").fill("Vaulty-bill-1");
    await page.getByRole("button", { name: /สมัครบัญชี|Create account/ }).click();
    await page.waitForURL(/\/vault/, { timeout: 20000 });
    await openSecurity(page);
  }

  record("B4", "เข้าสู่ระบบแล้วเห็นปุ่มเปิดใช้ทดสอบ", (await page.getByRole("button", { name: /เปิดใช้ทดสอบ|Activate test plan/ }).count()) >= 3);
  await page.getByRole("button", { name: /เริ่มทดลอง 14 วัน|Start 14-day trial/ }).waitFor({ timeout: 12000 });

  await page.getByRole("textbox", { name: /ชื่อผู้ซื้อ|Legal name/ }).fill("บจก. ทดสอบ วอลตี้");
  await page.getByPlaceholder("0105551234567").fill("1234567890123");
  await page.locator("#billing textarea").fill("123 ถ.ทดสอบ อ.บ้านค่าย จ.ระยอง");
  await page.getByRole("button", { name: /บันทึกข้อมูลผู้ซื้อ|Save buyer details/ }).click();
  await page.getByText(/บันทึกข้อมูลผู้ซื้อแล้ว|Buyer details saved/).waitFor({ timeout: 10000 });
  record("B5", "บันทึกข้อมูลผู้ซื้อได้", true);

  await page.getByRole("button", { name: /เปิดใช้ทดสอบ|Activate test plan/ }).first().click();
  await page.getByText(/เปิดแพ็กเกจทดสอบแล้ว|Test plan activated/).waitFor({ timeout: 10000 });
  record("B6", "เปิดแพ็กเกจครอบครัวทดสอบได้", (await page.getByText(/ใช้งานทดสอบ|Test active/).count()) > 0);

  const receipt = page.getByText(/ใบเสร็จรับเงิน \(ทดสอบ\)|Receipt \(test\)/);
  record("B7", "มีใบเสร็จทดสอบ", (await receipt.count()) > 0);
  record("B8", "มีใบกำกับทดสอบเมื่อกรอกเลขผู้เสียภาษี", (await page.getByText(/ใบกำกับภาษี \(ทดสอบ\)|Tax invoice \(test\)/).count()) > 0);

  const [dl] = await Promise.all([
    page.waitForEvent("download", { timeout: 15000 }),
    page.getByRole("button", { name: /ดาวน์โหลด|^Download$/ }).first().click(),
  ]);
  const out = join(tmpdir(), "vaulty-receipt.html");
  await dl.saveAs(out);
  const { readFileSync } = await import("node:fs");
  const body = readFileSync(out, "utf8");
  record("B9", "ใบเสร็จประทับเอกสารทดสอบ และไม่มีรหัสคลัง", /เอกสารทดสอบ/.test(body) && !/258036/.test(body), { slice: body.slice(0, 160) });
  record("B10", "ใบเสร็จบอกว่ายังไม่จดทะเบียน", /ยังไม่จดทะเบียน|not yet incorporated/.test(body));
} catch (err) {
  record("BX", "รันไม่ครบ", false, { err: String(err).slice(0, 300) });
} finally {
  const result = { ms: Date.now() - t0, passed: tasks.filter((x) => x.ok).length, total: tasks.length, ok: tasks.every((x) => x.ok), tasks };
  writeFileSync("/tmp/billing-e2e.json", JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
  process.exit(result.ok ? 0 : 1);
}
