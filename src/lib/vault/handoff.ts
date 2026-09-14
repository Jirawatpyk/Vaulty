import { addDaysIso } from "./format.ts";
import { t, type I18nKey } from "./i18n.ts";
import type { HealthReport } from "./health.ts";
import type { Lang, VaultData } from "./types.ts";
import { custodyPlainText, isOffsiteCustody, vaultCustody } from "./will-custody.ts";

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function icsDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export function checkInIcs(vault: VaultData, lang: Lang): string {
  const start = new Date(addDaysIso(vault.access.lastCheckIn, vault.access.checkInDays));
  const interval = Math.max(1, Math.min(365, vault.access.checkInDays || 30));
  const summary = lang === "th" ? "Vaulty — เช็คอินคลังมรดก" : "Vaulty — vault check-in";
  const desc =
    lang === "th"
      ? "เปิด Vaulty บนเครื่องนี้ แล้วกดเช็คอินตามแผนส่งมอบ"
      : "Open Vaulty on this device and tap check-in on the release plan.";
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Vaulty//Check-in//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:vaulty-checkin-${vault.createdAt}@local`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(start)}`,
    `RRULE:FREQ=DAILY;INTERVAL=${interval}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${desc}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

export function keyCardHtml(vault: VaultData, lang: Lang): string {
  const L = (k: I18nKey) => esc(t(lang, k));
  return `<!DOCTYPE html>
<html lang="${lang}"><head><meta charset="utf-8"/><title>Vaulty key card</title>
<style>
  body { font-family: "IBM Plex Sans Thai", "IBM Plex Sans", sans-serif; background: #e8e2d6; color: #1a1c18; }
  .card { max-width: 420px; margin: 24px auto; background: #0c1218; color: #efe7d6; padding: 28px 32px; border-radius: 16px; }
  .kicker { letter-spacing: .28em; font-size: 11px; text-transform: uppercase; color: #b7aa8e; }
  h1 { font-family: "Noto Serif Thai", Georgia, serif; font-weight: 500; font-size: 26px; margin: 8px 0 4px; }
  .box { border: 1px dashed #b7aa8e; min-height: 72px; margin: 16px 0; padding: 12px; color: #b7aa8e; font-size: 13px; }
  p { font-size: 13px; line-height: 1.55; }
  .legal { font-size: 12px; color: #b7aa8e; }
  @media print { body { background: white; } .no-print { display: none; } .card { margin: 0; } }
</style></head>
<body>
<article class="card">
  <p class="kicker">Vaulty</p>
  <h1>${esc(vault.profile.fullName || "Vaulty")}</h1>
  <p>${L("keyCardLead")}</p>
  <div class="box">${L("keyCardWriteHere")}</div>
  <p>${L("packetExecutor")}: ${esc(vault.access.executorName || "—")}</p>
  <p>${esc(vault.access.executorContact)}</p>
  ${
    isOffsiteCustody(vaultCustody(vault))
      ? `<p>${L("willCustodyTitle")}: ${esc(custodyPlainText(vaultCustody(vault), lang))}</p>`
      : `<p class="legal">${L("willCustodyMissing")}</p>`
  }
  <p class="legal">${L("packetLegal")}</p>
</article>
<p class="no-print" style="text-align:center"><button onclick="window.print()">${L("printPacket")}</button></p>
</body></html>`;
}

export function attestationHtml(report: HealthReport, lang: Lang): string {
  const L = (k: I18nKey) => esc(t(lang, k));
  const rows = report.controls
    .map((c) => `<tr><td>${L(c.key)}</td><td>${c.ok ? (c.warn ? "WATCH" : "PASS") : "FAIL"}</td></tr>`)
    .join("");
  return `<!DOCTYPE html>
<html lang="${lang}"><head><meta charset="utf-8"/><title>Vaulty attestation</title>
<style>
  body { font-family: "IBM Plex Sans Thai", sans-serif; background: #e8e2d6; color: #1a1c18; }
  .sheet { max-width: 720px; margin: 24px auto; background: #f4efe6; padding: 40px; }
  h1 { font-family: "Noto Serif Thai", Georgia, serif; font-weight: 500; }
  table { width: 100%; border-collapse: collapse; } td { padding: 8px 0; border-bottom: 1px solid #d9d3c6; }
  .legal { border: 1px solid #c4a574; padding: 12px; margin-top: 20px; font-size: 13px; }
</style></head>
<body>
<main class="sheet">
  <p style="letter-spacing:.28em;font-size:11px;text-transform:uppercase">Vaulty</p>
  <h1>${L("attestationTitle")}</h1>
  <p>${L("attestationLead")}</p>
  <table>${rows}</table>
  <p>${L("encryptionDetail")}</p>
  <p>${L("pbkdfDetail")}</p>
  <p>${L("footerLegal")}</p>
  <div class="legal">${L("packetLegal")}<br/>${L("attestationScope")}</div>
  <p style="font-size:12px;color:#5c5a52">${new Date().toISOString().slice(0, 10)}</p>
</main>
</body></html>`;
}
