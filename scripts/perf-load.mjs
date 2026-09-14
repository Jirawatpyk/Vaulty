#!/usr/bin/env node
import { chromium } from "playwright";

const url = process.env.PERF_URL || "http://127.0.0.1:8080/";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

const tNav = Date.now();
const response = await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
const navMs = Date.now() - tNav;

const metrics = await page.evaluate(() => {
  const nav = performance.getEntriesByType("navigation")[0];
  const resources = performance.getEntriesByType("resource");
  const transfer = resources.reduce((s, r) => s + (r.transferSize || 0), 0);
  return {
    ttfb: nav ? Math.round(nav.responseStart - nav.requestStart) : null,
    dcl: nav ? Math.round(nav.domContentLoadedEventEnd - nav.startTime) : null,
    load: nav ? Math.round(nav.loadEventEnd - nav.startTime) : null,
    resources: resources.length,
    transferKb: Math.round(transfer / 1024),
    nodes: document.getElementsByTagName("*").length,
  };
});

const tDemo = Date.now();
const demo = page.getByRole("button", { name: /เปิดคลังตัวอย่าง|Open sample/i }).first();
if (await demo.count()) {
  await demo.click();
  await page.getByRole("heading", { name: /สุทธิดา|Sutthida/i }).waitFor({ timeout: 20000 });
}
const demoMs = Date.now() - tDemo;

const tAssets = Date.now();
await page.getByRole("link", { name: /ทรัพย์สิน|Assets/i }).first().click();
await page.getByRole("heading", { name: /ทรัพย์สิน|Assets/i }).waitFor({ timeout: 10000 });
const assetsMs = Date.now() - tAssets;
const assetNodes = await page.evaluate(() => document.getElementsByTagName("*").length);
const lis = await page.locator("main li, #main li, ul li").count();

await browser.close();

const report = {
  url,
  status: response?.status() ?? 0,
  gate: { navMs, ...metrics },
  demoUnlockMs: demoMs,
  assetsNavMs: assetsMs,
  assetsDomNodes: assetNodes,
  assetRows: lis,
  budgets: {
    gateNavMs: 4000,
    demoUnlockMs: 8000,
    ttfbMs: 800,
    transferKb: 1800,
  },
};

const fail = [];
if (report.status !== 200) fail.push("status");
if (navMs > report.budgets.gateNavMs) fail.push("gateNav");
if (demoMs > report.budgets.demoUnlockMs) fail.push("demoUnlock");
if ((metrics.ttfb ?? 0) > report.budgets.ttfbMs) fail.push("ttfb");
if ((metrics.transferKb ?? 0) > report.budgets.transferKb) fail.push("transfer");

report.ok = fail.length === 0;
report.failedBudgets = fail;
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
