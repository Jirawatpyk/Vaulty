import { t, type I18nKey } from "./i18n.ts";
import { canRestore } from "./recover.ts";
import type { Lang } from "./types.ts";

function esc(value: string): string {
  return value.replaceAll("&", "&" + "amp;").replaceAll("<", "&" + "lt;").replaceAll(">", "&" + "gt;").replaceAll('"', "&" + "quot;");
}

export async function sealedFingerprint(raw: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 12);
}

export function formatFingerprint(hex: string): string {
  const clean = hex.replace(/[^0-9a-f]/gi, "").slice(0, 12);
  return clean.replace(/(.{4})/g, "$1 ").trim();
}

export function crossDeviceGuideHtml(lang: Lang, fingerprint: string, ownerName: string): string {
  const L = (k: I18nKey) => esc(t(lang, k));
  const fp = esc(formatFingerprint(fingerprint) || "—");
  return `<!DOCTYPE html>
<html lang="${lang}"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Vaulty — ${L("crossTitle")}</title>
<style>
  body { font-family: "IBM Plex Sans Thai", "IBM Plex Sans", sans-serif; background: #e8e2d6; color: #1a1c18; margin: 0; }
  .sheet { max-width: 640px; margin: 24px auto; background: #f4efe6; padding: 36px 40px; }
  h1 { font-family: "Noto Serif Thai", Georgia, serif; font-weight: 500; font-size: 26px; }
  h2 { font-size: 12px; letter-spacing: .16em; text-transform: uppercase; color: #5c5a52; }
  p, li { font-size: 15px; line-height: 1.55; }
  .fp { font-variant-numeric: tabular-nums; letter-spacing: .12em; font-size: 20px; margin: 8px 0; }
  .legal { border: 1px solid #8a3b2a; padding: 12px 14px; margin: 16px 0; font-size: 14px; }
  @media print { body { background: white; } .sheet { margin: 0; } .no-print { display: none; } }
</style></head>
<body>
<main class="sheet">
  <p style="letter-spacing:.28em;font-size:11px;text-transform:uppercase">Vaulty</p>
  <h1>${L("crossTitle")}</h1>
  <p>${L("crossLead")}</p>
  <p>${esc(ownerName)}</p>
  <div class="legal">${L("crossLegal")}</div>
  <h2>${L("crossFinger")}</h2>
  <p class="fp">${fp}</p>
  <h2>1</h2>
  <p>${L("crossStep1")}</p>
  <h2>2</h2>
  <p>${L("crossStep2")}</p>
  <h2>3</h2>
  <p>${L("crossStep3")}</p>
  <p>${L("crossPinWarn")}</p>
</main>
<p class="no-print" style="text-align:center;padding:16px"><button onclick="window.print()">${L("printPacket")}</button></p>
</body></html>`;
}

export { canRestore };
