import { heirValue, totalValue } from "./completeness.ts";
import { formatThb } from "./format.ts";
import { t } from "./i18n.ts";
import type { Beneficiary, Lang, VaultData } from "./types.ts";
import { custodyPlainText, vaultCustody } from "./will-custody.ts";

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function slug(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9ก-๙]+/gi, "-").replace(/^-|-$/g, "") || "heir";
}

export function familyPackFileName(heir: Beneficiary): string {
  return `vaulty-family-${slug(heir.name)}.html`;
}

export function familyPackHtml(vault: VaultData, heir: Beneficiary, lang: Lang): string {
  const assigned = vault.assets.filter((a) => a.beneficiaryIds.includes(heir.id));
  const letters = vault.letters.filter((l) => l.toBeneficiaryId === heir.id);
  const docs = vault.documents;
  const value = heirValue(vault, heir.id) || (heir.sharePercent / 100) * totalValue(vault);
  const wishes = [
    vault.wishes.funeral && `<p><strong>${esc(t(lang, "funeral"))}</strong> — ${esc(vault.wishes.funeral)}</p>`,
    vault.wishes.restingPlace && `<p><strong>${esc(t(lang, "restingPlace"))}</strong> — ${esc(vault.wishes.restingPlace)}</p>`,
    `<p><strong>${esc(t(lang, "organDonation"))}</strong> — ${vault.wishes.organDonation ? (lang === "th" ? "ใช่" : "Yes") : (lang === "th" ? "ไม่" : "No")}</p>`,
    vault.wishes.digitalAfterlife && `<p><strong>${esc(t(lang, "digitalAfterlife"))}</strong> — ${esc(vault.wishes.digitalAfterlife)}</p>`,
    vault.wishes.other && `<p><strong>${esc(t(lang, "otherWishes"))}</strong> — ${esc(vault.wishes.other)}</p>`,
  ]
    .filter(Boolean)
    .join("");

  const assets = assigned.length
    ? assigned
        .map(
          (a) => `<tr>
      <td>${esc(a.name)}</td>
      <td>${esc(a.institution)}</td>
      <td>${esc(a.identifier)}</td>
      <td>${esc(a.location)}</td>
      <td class="num">${esc(formatThb(a.valueThb, lang))}</td>
    </tr>
    ${a.notes ? `<tr class="note"><td colspan="5">${esc(a.notes)}</td></tr>` : ""}`,
        )
        .join("")
    : `<tr><td colspan="5">${esc(t(lang, "packetEmpty"))}</td></tr>`;

  const letterBlocks = letters
    .map(
      (l) => `<article class="letter"><h3>${esc(l.title)}</h3><p>${esc(l.body).replace(/\n/g, "<br/>")}</p></article>`,
    )
    .join("");

  const docList = docs.length
    ? `<ul>${docs.map((d) => `<li>${esc(d.title)}</li>`).join("")}</ul>`
    : `<p>${esc(t(lang, "none"))}</p>`;

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Vaulty — ${esc(t(lang, "packetTitle"))} — ${esc(heir.name)}</title>
<style>
  body { font-family: "Noto Serif Thai", "Noto Serif", Georgia, serif; color: #1a1c18; background: #e8e2d6; margin: 0; }
  .sheet { max-width: 720px; margin: 24px auto; background: #f4efe6; padding: 40px 44px; }
  h1 { font-weight: 500; font-size: 28px; margin: 8px 0 0; }
  h2 { font-size: 13px; letter-spacing: .18em; text-transform: uppercase; color: #5c5a52; font-weight: 600; }
  h3 { font-size: 18px; font-weight: 500; margin: 0 0 8px; }
  p, td, li { font-size: 14px; line-height: 1.55; }
  .kicker { font-size: 11px; letter-spacing: .28em; text-transform: uppercase; color: #5c5a52; }
  .legal { border: 1px solid #c4a574; padding: 12px 14px; margin: 20px 0; font-size: 13px; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 8px 6px; border-bottom: 1px solid #d9d3c6; vertical-align: top; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .note td { border-bottom: 1px solid #d9d3c6; color: #5c5a52; font-size: 13px; }
  .letter { border: 1px solid #d9d3c6; padding: 14px; margin: 12px 0; }
  .muted { color: #5c5a52; }
  @media print { body { background: white; } .sheet { margin: 0; padding: 12mm; } .no-print { display: none; } }
</style>
</head>
<body>
<main class="sheet">
  <p class="kicker">Vaulty</p>
  <h1>${esc(t(lang, "packetTitle"))}</h1>
  <p class="muted">${esc(t(lang, "packetLead"))}</p>
  <div class="legal">${esc(t(lang, "packetLegal"))}</div>
  <p class="muted">${esc(t(lang, "packetSecretsOmitted"))}</p>

  <h2>${esc(t(lang, "to"))}</h2>
  <p style="font-size:22px;margin:4px 0 0">${esc(heir.name)}</p>
  <p class="muted">${heir.sharePercent}% · ${esc(formatThb(value, lang))}</p>
  ${heir.email ? `<p class="muted">${esc(heir.email)}</p>` : ""}
  ${heir.phone ? `<p class="muted">${esc(heir.phone)}</p>` : ""}

  <h2>${esc(t(lang, "packetAssets"))}</h2>
  <table>
    <thead><tr><td>${esc(t(lang, "name"))}</td><td>${esc(t(lang, "institution"))}</td><td>${esc(t(lang, "identifier"))}</td><td>${esc(t(lang, "location"))}</td><td class="num">${esc(lang === "th" ? "มูลค่า" : "Value")}</td></tr></thead>
    <tbody>${assets}</tbody>
  </table>

  ${letters.length ? `<h2>${esc(t(lang, "packetLetters"))}</h2>${letterBlocks}` : ""}

  <h2>${esc(t(lang, "packetWishes"))}</h2>
  ${wishes || `<p>${esc(t(lang, "none"))}</p>`}

  <h2>${esc(t(lang, "documents"))}</h2>
  ${docList}

  <h2>${esc(t(lang, "willCustodyTitle"))}</h2>
  <p>${esc(custodyPlainText(vaultCustody(vault), lang))}</p>
  ${vaultCustody(vault).notes.trim() ? `<p class="muted">${esc(vaultCustody(vault).notes)}</p>` : ""}
  <p class="muted">${esc(t(lang, "willCustodyLegal"))}</p>

  <h2>${esc(t(lang, "packetExecutor"))}</h2>
  <p>${esc(vault.access.executorName || t(lang, "none"))}</p>
  <p class="muted">${esc(vault.access.executorRole)} ${esc(vault.access.executorContact)}</p>
  <p class="muted">${esc(t(lang, "emergency"))}: ${esc(vault.access.emergencyName)} ${esc(vault.access.emergencyContact)}</p>

  <h2>${esc(t(lang, "packetHowToRestore"))}</h2>
  <p>${esc(t(lang, "packetRestoreBody"))}</p>
  <p class="muted">${esc(vault.profile.fullName)} · ${new Date().toISOString().slice(0, 10)}</p>
</main>
</body>
</html>`;
}

export function allFamilyPacksHtml(vault: VaultData, lang: Lang): string {
  if (vault.beneficiaries.length === 0) return familyPackHtml(vault, {
    id: "none",
    name: t(lang, "heirs"),
    relationship: "other",
    sharePercent: 0,
    email: "",
    phone: "",
    notes: "",
  }, lang);
  const parts = vault.beneficiaries.map((heir) => {
    const inner = familyPackHtml(vault, heir, lang);
    const match = inner.match(/<main class="sheet">([\s\S]*?)<\/main>/);
    return `<main class="sheet pack">${match ? match[1] : ""}</main>`;
  });
  return `<!DOCTYPE html>
<html lang="${lang}"><head><meta charset="utf-8"/><title>Vaulty family packs</title>
<style>
  body { font-family: "Noto Serif Thai", Georgia, serif; background: #e8e2d6; color: #1a1c18; }
  .sheet { max-width: 720px; margin: 24px auto; background: #f4efe6; padding: 40px 44px; page-break-after: always; }
  h1 { font-weight: 500; } h2 { font-size: 13px; letter-spacing: .18em; text-transform: uppercase; color: #5c5a52; }
  table { width: 100%; border-collapse: collapse; } td { padding: 8px 6px; border-bottom: 1px solid #d9d3c6; }
  .legal { border: 1px solid #c4a574; padding: 12px 14px; margin: 20px 0; font-size: 13px; }
  .muted { color: #5c5a52; } .num { text-align: right; }
  @media print { .pack { page-break-after: always; } }
</style></head><body>${parts.join("\n")}</body></html>`;
}

export function packContainsSecret(html: string, vault: VaultData): boolean {
  return vault.assets.some((a) => a.secret && html.includes(a.secret))
    || vault.documents.some((d) => d.secret && html.includes(d.secret));
}
