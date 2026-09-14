#!/usr/bin/env node
import { chromium } from "playwright";
import { writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

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
    await page.getByRole("alertdialog").getByRole("button", { name: /^ลบคลัง$|^Erase vault$/ }).click({ force: true });
    await page.getByRole("heading", { name: "Vaulty" }).waitFor({ timeout: 8000 });
  }
}

async function openDemo(page) {
  await wipeIfNeeded(page);
  await page.getByRole("button", { name: /เปิดคลังตัวอย่าง|Open sample vault/ }).click();
  const confirm = page.getByRole("button", { name: /เปิดคลังตัวอย่าง|Open sample vault/ }).nth(1);
  if (await confirm.isVisible().catch(() => false)) await confirm.click();
  await page.waitForURL(/\/vault/, { timeout: 20000 });
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

async function signInFresh(page) {
  const signIn = page.getByRole("link", { name: /เข้าสู่ระบบ|Sign in/ });
  if (!(await signIn.count())) return false;
  await signIn.first().click();
  await page.waitForURL(/\/login/, { timeout: 10000 });
  await page.locator("#consent-account").check();
  const mail = `use.bill.${Date.now()}@vaulty.test`;
  await page.getByRole("textbox", { name: /เมล|Email/ }).fill(mail);
  await page.locator("input[type=password]").fill("Vaulty-bill-1");
  await page.getByRole("button", { name: /สมัครบัญชี|Create account/ }).click();
  await page.waitForURL(/\/vault/, { timeout: 20000 });
  await openSecurity(page);
  return true;
}

const browser = await chromium.launch({ headless: true });
const t0 = Date.now();

try {
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "th-TH" });
  const page = await phone.newPage();
  await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
  await openDemo(page);
  await openSecurity(page);

  const panel = page.locator("#billing");
  const text = await panel.innerText();
  record("U1", "หาแผงแพ็กเกจได้จากแผนส่งมอบ → ความปลอดภัย", /แพ็กเกจและใบกำกับ/.test(text));
  record("U2", "อ่านได้ทันทีว่าโหมดทดสอบ ยังไม่จดบริษัท ไม่เก็บเงินจริง", /โหมดทดสอบ/.test(text) && /ยังไม่จด/.test(text) && /ไม่ตัดบัตร|ไม่เก็บเงินจริง/.test(text));
  record("U3", "เห็นราคาสามแพ็กเกจก่อนเข้าสู่ระบบ", /ครอบครัว/.test(text) && /มรดก/.test(text) && /สำนักงาน/.test(text) && /1,990/.test(text) && /4,990/.test(text) && /14,900/.test(text));
  record("U4", "ป้ายผู้ขายไม่ซ้ำ", (text.match(/ผู้ขาย/g) || []).length === 1, { seller: (text.match(/ผู้ขาย/g) || []).length });
  record("U5", "ปุ่มเข้าสู่ระบบบอกว่าเพื่อเปิดใช้ ไม่ใช่แค่ดูแพ็กเกจ", /เปิดใช้ทดสอบและออกเอกสาร/.test(text) && !/เพื่อดูแพ็กเกจ/.test(text));

  const overflowPhone = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 4);
  record("U6", "จอมือถือไม่ล้นแนวนอนที่แผงแพ็กเกจ", !overflowPhone);

  const unnamed = await panel.evaluate((el) =>
    [...el.querySelectorAll("button, a[href]")].filter((n) => {
      const name = (n.getAttribute("aria-label") || n.textContent || "").replace(/\s+/g, " ").trim();
      return !name && n.getAttribute("aria-hidden") !== "true";
    }).length,
  );
  record("U7", "ปุ่มในแผงมีชื่ออ่านได้", unnamed === 0, { unnamed });

  await signInFresh(page);
  await page.getByRole("button", { name: /เริ่มทดลอง 14 วัน|Start 14-day trial/ }).waitFor({ timeout: 12000 });
  const after = await page.locator("#billing").innerText();
  record("U8", "เข้าสู่ระบบแล้วเห็นทดลอง 14 วัน และคำอธิบาย", /เริ่มทดลอง 14 วัน/.test(after) && /ยังไม่ต้องเลือกแพ็กเกจ/.test(after));
  record(
    "U9",
    "ตัวนำทางชื่อผู้ซื้อเป็นบริษัท/ชื่อคน ไม่ใช่ทนายผู้จัดการมรดก",
    (await page.getByPlaceholder(/บจก|ชื่อ-นามสกุล/).count()) > 0 && (await page.getByPlaceholder(/ทนาย|พี่ชาย/).count()) === 0,
  );
  record("U10", "ตัวนำทางที่อยู่เป็นที่อยู่เต็ม ไม่ใช่ชื่อเมืองอย่างเดียว", (await page.getByPlaceholder(/บ้านเลขที่|ถนน|ตำบล/).count()) > 0);

  const tax = page.getByPlaceholder("0105551234567");
  await tax.fill("123456789012");
  const err = page.getByText("เลขผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก");
  await err.waitFor({ timeout: 4000 });
  const saveDisabled = await page.getByRole("button", { name: /บันทึกข้อมูลผู้ซื้อ/ }).isDisabled();
  record("U11", "เลขผู้เสียภาษี 12 หลักเตือนและกันบันทึก", (await err.count()) > 0 && saveDisabled);

  await tax.fill("1234567890123");
  record("U12", "ครบ 13 หลักแล้วบันทึกได้", !(await page.getByRole("button", { name: /บันทึกข้อมูลผู้ซื้อ/ }).isDisabled()));

  await page.getByPlaceholder(/บจก|ชื่อ-นามสกุล/).fill("บจก. ทดสอบ วอลตี้");
  await page.locator("#billing textarea").fill("123 ถ.ทดสอบ อ.บ้านค่าย จ.ระยอง");
  await page.getByRole("button", { name: /บันทึกข้อมูลผู้ซื้อ/ }).click();
  await page.getByText(/บันทึกข้อมูลผู้ซื้อแล้ว/).waitFor({ timeout: 10000 });
  record("U13", "บันทึกข้อมูลผู้ซื้อแล้วมีเสียงตอบ", true);

  const careBtn = page.getByRole("button", { name: /เปิดใช้ทดสอบ · ครอบครัว/ });
  const box = await careBtn.boundingBox();
  record("U14", "ปุ่มเปิดใช้ครอบครัวสูงอย่างน้อย 44px", Boolean(box && box.height >= 44), { h: box?.height });
  await careBtn.click();
  await page.getByText(/เปิดแพ็กเกจทดสอบแล้ว/).waitFor({ timeout: 10000 });
  record("U15", "เปิดครอบครัวแล้วเห็นใบเสร็จและใบกำกับทดสอบ", (await page.getByText(/ใบเสร็จรับเงิน \(ทดสอบ\)/).count()) > 0 && (await page.getByText(/ใบกำกับภาษี \(ทดสอบ\)/).count()) > 0);
  record("U20", "วันหมดอายุเป็นวันที่อ่านได้ ไม่ใช่ Tue Sep", !/Tue Sep/.test(await page.locator("#billing").innerText()) && /ใช้ได้ถึง/.test(await page.locator("#billing").innerText()));

  const [dl] = await Promise.all([
    page.waitForEvent("download", { timeout: 15000 }),
    page.getByRole("button", { name: /ดาวน์โหลด/ }).first().click(),
  ]);
  const out = join(tmpdir(), "vaulty-use-receipt.html");
  await dl.saveAs(out);
  const html = readFileSync(out, "utf8");
  record("U16", "ไฟล์ที่โหลดประทับเอกสารทดสอบ ไม่มีรหัสคลัง", /เอกสารทดสอบ/.test(html) && !/258036/.test(html) && /ยังไม่จดทะเบียน/.test(html));

  const cancel = page.getByRole("button", { name: /ยกเลิกแพ็กเกจทดสอบ|Cancel test plan/ });
  await cancel.scrollIntoViewIfNeeded();
  await cancel.click({ force: true });
  await page.getByText("ยกเลิกแล้ว", { exact: true }).waitFor({ timeout: 12000 });
  record("U17", "ยกเลิกแพ็กเกจแล้วสถานะเป็นยกเลิกแล้ว", (await page.getByText("ยกเลิกแล้ว", { exact: true }).count()) > 0);
  await phone.close();

  const desk = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: "en-US" });
  const en = await desk.newPage();
  await en.goto(url, { waitUntil: "networkidle", timeout: 45000 });
  await en.getByRole("button", { name: /สลับภาษา|Switch language/ }).click();
  await openDemo(en);
  await openSecurity(en);
  const enText = await en.locator("#billing").innerText();
  record("U18", "สลับอังกฤษแล้วหัวข้อและป้ายทดสอบเป็นอังกฤษครบ", /Plans and invoices/.test(enText) && /test copies|test mode/i.test(enText) && /Care/.test(enText) && /Estate/.test(enText) && /Counsel/.test(enText), { slice: enText.slice(0, 280) });

  await en.evaluate(() => {
    document.documentElement.style.zoom = "2";
  });
  await en.waitForTimeout(300);
  const overflowZoom = await en.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 8);
  record("U19", "ขยาย 200% แผงแพ็กเกจไม่ล้นจอ", !overflowZoom, { overflowZoom });
  await desk.close();
} catch (err) {
  record("UX", "รันไม่ครบ", false, { err: String(err).slice(0, 400) });
}

const result = {
  ms: Date.now() - t0,
  passed: tasks.filter((x) => x.ok).length,
  total: tasks.length,
  ok: tasks.every((x) => x.ok),
  findings,
  tasks,
};
writeFileSync("/tmp/billing-usability.json", JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
await browser.close();
process.exit(result.ok ? 0 : 1);
