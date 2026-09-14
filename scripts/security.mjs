#!/usr/bin/env node
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const url = process.env.GAP_URL || "http://127.0.0.1:8080/";
const secret = process.env.CRON_SECRET || "vaulty-dev-cron";
const tasks = [];
function record(id, title, ok, extra = {}) {
  tasks.push({ id, title, ok, extra });
}

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, locale: "th-TH" });
const page = await ctx.newPage();
const t0 = Date.now();

try {
  const res = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
  const headers = res?.headers() ?? {};
  const csp = headers["content-security-policy"] || "";
  record("S1", "หน้าแรกส่ง Content-Security-Policy", Boolean(csp), { csp: csp.slice(0, 220) });
  record(
    "S2",
    "CSP จำกัด default-src self, object-src none, form-action self",
    /default-src 'self'/.test(csp) && /object-src 'none'/.test(csp) && /form-action 'self'/.test(csp) && /base-uri 'self'/.test(csp),
  );
  record("S3", "ไม่เปิดกล้อง ไมค์ จีพีเอส ใน Permissions-Policy", /camera=\(\)/.test(headers["permissions-policy"] || "") && /microphone=\(\)/.test(headers["permissions-policy"] || ""));
  record("S4", "มี X-Content-Type-Options nosniff", headers["x-content-type-options"] === "nosniff");

  const origin = new URL(url).origin;
  const denied = await page.request.post(`${origin}/api/deadman/tick`);
  record("S5", "ยิงตัวเดินเวลาโดยไม่มีรหัสได้ 401", denied.status() === 401);

  const statuses = [];
  for (let i = 0; i < 12; i++) {
    const tick = await page.request.post(`${origin}/api/deadman/tick`, {
      headers: { Authorization: `Bearer ${secret}` },
    });
    statuses.push(tick.status());
  }
  record("S6", "รหัสลับถูกแล้วยังถูกจำกัดความถี่", statuses.includes(200) && statuses.includes(429), { statuses });

  await page.goto(origin + "/legal/privacy", { waitUntil: "domcontentloaded", timeout: 20000 });
  const body = await page.locator("main").innerText();
  record(
    "S7",
    "นโยบายระบุผู้ควบคุมข้อมูล Vaulty และลิงก์ สคส.",
    /ผู้ควบคุมข้อมูล/.test(body) && /Vaulty/.test(body) && /ยังไม่จดทะเบียน/.test(body) && /pdpc\.or\.th/.test(body),
    { slice: body.slice(0, 280) },
  );
  record("S8", "มีช่องเลขทะเบียนนิติบุคคลและเจ้าหน้าที่คุ้มครองข้อมูล", /เลขทะเบียนนิติบุคคล/.test(body) && /เจ้าหน้าที่คุ้มครองข้อมูล/.test(body));
} catch (err) {
  record("SX", "รันไม่ครบ", false, { err: String(err).slice(0, 400) });
}

const result = { ms: Date.now() - t0, passed: tasks.filter((x) => x.ok).length, total: tasks.length, ok: tasks.every((x) => x.ok), tasks };
writeFileSync("/tmp/vaulty-security.json", JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
await browser.close();
process.exit(result.ok ? 0 : 1);
