#!/usr/bin/env node
import { chromium } from "playwright";

const url = process.env.A11Y_URL || "http://127.0.0.1:8080/";

function auditSource() {
  const issues = [];
  const html = document.documentElement;
  if (!html.lang) issues.push({ id: "html-lang", impact: "serious", help: "html has no lang" });

  const title = document.title?.trim();
  if (!title) issues.push({ id: "title", impact: "serious", help: "document title is empty" });

  const buttons = [...document.querySelectorAll("button, a[href], [role=button]")];
  for (const el of buttons) {
    if (el.getAttribute("aria-hidden") === "true") continue;
    const name = (
      el.getAttribute("aria-label") ||
      el.innerText ||
      el.getAttribute("title") ||
      ""
    )
      .replace(/\s+/g, " ")
      .trim();
    if (!name) issues.push({ id: "name", impact: "serious", help: `${el.tagName} has no accessible name` });
  }

  const unlabeled = [...document.querySelectorAll("input:not([type=hidden]):not([type=file]), select, textarea")].filter(
    (el) => {
      if (el.getAttribute("aria-label") || el.getAttribute("aria-labelledby")) return false;
      const id = el.id;
      if (id && document.querySelector(`label[for="${CSS.escape(id)}"]`)) return false;
      return !el.closest("label");
    },
  );
  for (const el of unlabeled) {
    issues.push({ id: "label", impact: "serious", help: `${el.tagName} missing label` });
  }

  const imgs = [...document.querySelectorAll("img")];
  for (const img of imgs) {
    if (img.getAttribute("alt") === null && img.getAttribute("aria-hidden") !== "true") {
      issues.push({ id: "img-alt", impact: "serious", help: "img missing alt" });
    }
  }

  const ids = [...document.querySelectorAll("[id]")].map((el) => el.id).filter(Boolean);
  const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
  for (const id of [...new Set(dup)]) issues.push({ id: "dup-id", impact: "moderate", help: `duplicate id ${id}` });

  const positiveTab = [...document.querySelectorAll("[tabindex]")].filter((el) => Number(el.getAttribute("tabindex")) > 0);
  for (const el of positiveTab) issues.push({ id: "tabindex", impact: "serious", help: "positive tabindex" });

  const headings = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((h) => Number(h.tagName[1]));
  if (headings.length && headings[0] !== 1) issues.push({ id: "h1", impact: "moderate", help: "page does not start with h1" });

  return {
    lang: html.lang,
    title,
    h1: document.querySelector("h1")?.textContent?.trim() ?? null,
    issues,
  };
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });

const welcome = await page.evaluate(auditSource);

await page.keyboard.press("Tab");
const skipOrFocus = await page.evaluate(() => {
  const el = document.activeElement;
  return {
    tag: el?.tagName,
    name: (el?.getAttribute("aria-label") || el?.innerText || "").trim().slice(0, 80),
  };
});

const demo = page.getByRole("button", { name: /เปิดคลังตัวอย่าง|Open sample/i }).first();
if (await demo.count()) {
  await demo.click();
  await page.getByRole("heading").first().waitFor({ timeout: 20000 });
}
await page.waitForTimeout(800);

const vault = await page.evaluate(auditSource);
const skip = await page.getByRole("link", { name: /ข้ามไปยังเนื้อหา|Skip to content/i }).count();
const meter = await page.getByRole("meter").count();
const navs = await page.evaluate(() =>
  [...document.querySelectorAll("nav")].map((n) => n.getAttribute("aria-label")),
);

await page.keyboard.press("Tab");
const afterTab = await page.evaluate(() => document.activeElement?.tagName);

await page.getByRole("link", { name: /ทรัพย์สิน|Assets/i }).first().click();
await page.waitForTimeout(400);
const assets = await page.evaluate(auditSource);

await browser.close();

const all = [...welcome.issues, ...vault.issues, ...assets.issues];
const report = {
  url,
  welcome,
  vault: { ...vault, skipLink: skip, completenessMeter: meter, navLabels: navs },
  assets,
  keyboard: { firstTab: skipOrFocus, afterVaultTab: afterTab },
  failCount: all.length,
  ok: all.length === 0 && skip >= 1 && meter >= 1,
};

console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
