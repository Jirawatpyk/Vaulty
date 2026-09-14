import { totalValue, vaultTasks } from "./completeness.ts";
import { formatThb } from "./format.ts";
import { categoryLabel, documentLabel, maritalLabel, relationshipLabel, t, type I18nKey } from "./i18n.ts";
import { maritalSplit, maritalWarning } from "./marital.ts";
import { estimateInheritanceTax } from "./inheritance-tax.ts";
import type { Lang, VaultData } from "./types.ts";
import {
  custodyPlainText,
  custodyStatus,
  isOffsiteCustody,
  vaultCustody,
} from "./will-custody.ts";

function esc(value: string): string {
  return value
    .replaceAll("&", "&" + "amp;")
    .replaceAll("<", "&" + "lt;")
    .replaceAll(">", "&" + "gt;")
    .replaceAll('"', "&" + "quot;");
}

function dash(value: string, empty = "—"): string {
  const v = value.trim();
  return v ? esc(v) : empty;
}

function fmtDate(iso: string, lang: Lang): string {
  if (!iso.trim()) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return esc(iso);
  return d.toLocaleDateString(lang === "th" ? "th-TH" : "en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function lawyerBriefFileName(lang: Lang): string {
  return lang === "th" ? "vaulty-lawyer-brief.html" : "vaulty-lawyer-brief.html";
}

export function lawyerBriefGaps(vault: VaultData): I18nKey[] {
  const share = vault.beneficiaries.reduce((s, b) => s + b.sharePercent, 0);
  const gaps: I18nKey[] = [];
  if (!vault.profile.fullName.trim()) gaps.push("taskProfile");
  if (!vault.profile.dateOfBirth.trim()) gaps.push("gapDob");
  if (!vault.profile.city.trim() || !vault.profile.occupation.trim()) gaps.push("taskProfile");
  if (vault.assets.length === 0) gaps.push("taskAsset");
  if (vault.beneficiaries.length === 0) gaps.push("taskHeir");
  if (vault.beneficiaries.length > 0 && Math.abs(share - 100) >= 0.5) gaps.push("taskShare");
  if (!vault.access.executorName.trim()) gaps.push("taskExecutor");
  if (!vault.access.executorContact.trim()) gaps.push("gapExecutorContact");
  if (vault.assets.some((a) => a.beneficiaryIds.length === 0)) gaps.push("gapUnassigned");
  if (vault.assets.some((a) => a.valueThb > 0 && a.marital !== "marital" && a.marital !== "separate")) {
    gaps.push("taskMarital");
  }
  if (!vault.wishes.funeral.trim()) gaps.push("taskFuneral");
  if (!isOffsiteCustody(vaultCustody(vault))) gaps.push("taskWillCustody");
  return [...new Set(gaps)];
}

export function lawyerBriefHtml(vault: VaultData, lang: Lang): string {
  const L = (k: I18nKey) => esc(t(lang, k));
  const share = vault.beneficiaries.reduce((s, b) => s + b.sharePercent, 0);
  const worth = totalValue(vault);
  const split = maritalSplit(vault);
  const warn = maritalWarning(split, lang);
  const tax = estimateInheritanceTax(vault);
  const generated = fmtDate(new Date().toISOString(), lang);
  const gaps = lawyerBriefGaps(vault);
  const heirName = (id: string) => vault.beneficiaries.find((b) => b.id === id)?.name ?? t(lang, "unassigned");

  const heirRows = vault.beneficiaries.length
    ? vault.beneficiaries
        .map(
          (b) => `<tr>
      <td>${esc(b.name)}</td>
      <td>${esc(relationshipLabel[lang][b.relationship])}</td>
      <td class="num">${b.sharePercent}%</td>
      <td>${dash(b.email)}</td>
      <td>${dash(b.phone)}</td>
    </tr>
    ${b.notes ? `<tr class="note"><td colspan="5">${esc(b.notes)}</td></tr>` : ""}`,
        )
        .join("")
    : `<tr><td colspan="5">${L("none")}</td></tr>`;

  const assetRows = vault.assets.length
    ? vault.assets
        .map((a) => {
          const heirs =
            a.beneficiaryIds.length === 0
              ? esc(t(lang, "unassigned"))
              : esc(a.beneficiaryIds.map(heirName).join(", "));
          return `<tr>
      <td>${esc(a.name)}</td>
      <td>${esc(categoryLabel[lang][a.category])}</td>
      <td>${esc(maritalLabel[lang][a.marital ?? "unknown"])}</td>
      <td>${dash(a.institution)}</td>
      <td>${dash(a.identifier)}</td>
      <td>${dash(a.location)}</td>
      <td class="num">${esc(formatThb(a.valueThb, lang))}</td>
      <td>${heirs}</td>
    </tr>
    ${a.notes ? `<tr class="note"><td colspan="8">${esc(a.notes)}</td></tr>` : ""}`;
        })
        .join("")
    : `<tr><td colspan="8">${L("none")}</td></tr>`;

  const willDocs = vault.documents.filter((d) => d.kind === "will");
  const otherDocs = vault.documents.filter((d) => d.kind !== "will");
  const custody = vaultCustody(vault);
  const custodyStatusNow = custodyStatus(custody);
  const docList = (docs: typeof vault.documents) =>
    docs.length
      ? `<ul>${docs
          .map(
            (d) =>
              `<li><strong>${esc(d.title)}</strong> — ${esc(documentLabel[lang][d.kind])}${
                d.notes ? ` · ${esc(d.notes)}` : ""
              }${d.fileName ? ` · ${esc(d.fileName)}` : ""}</li>`,
          )
          .join("")}</ul>`
      : `<p>${L("none")}</p>`;

  const letters = vault.letters.length
    ? `<ul>${vault.letters
        .map((l) => `<li>${esc(l.title)} — ${L("to")} ${esc(heirName(l.toBeneficiaryId))}</li>`)
        .join("")}</ul>`
    : `<p>${L("none")}</p>`;

  const gapList = gaps.length
    ? `<ul class="gaps">${gaps.map((g) => `<li>${L(g)}</li>`).join("")}</ul>`
    : `<p>${L("lawyerGapsNone")}</p>`;

  const wishes = [
    vault.wishes.funeral && `<p><strong>${L("funeral")}</strong> — ${esc(vault.wishes.funeral)}</p>`,
    vault.wishes.restingPlace && `<p><strong>${L("restingPlace")}</strong> — ${esc(vault.wishes.restingPlace)}</p>`,
    `<p><strong>${L("organDonation")}</strong> — ${vault.wishes.organDonation ? L("yes") : L("no")}</p>`,
    vault.wishes.digitalAfterlife && `<p><strong>${L("digitalAfterlife")}</strong> — ${esc(vault.wishes.digitalAfterlife)}</p>`,
    vault.wishes.other && `<p><strong>${L("otherWishes")}</strong> — ${esc(vault.wishes.other)}</p>`,
  ]
    .filter(Boolean)
    .join("");

  const checklist = [1, 2, 3, 4, 5].map((n) => `<li>${L(`lawyerCheck${n}` as I18nKey)}</li>`).join("");
  const complete = vaultTasks(vault).filter((x) => x.done).length;

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Vaulty — ${L("lawyerBriefTitle")} — ${dash(vault.profile.fullName)}</title>
<style>
  body { font-family: "Noto Serif Thai", "Noto Serif", Georgia, serif; color: #1a1c18; background: #e8e2d6; margin: 0; }
  .sheet { max-width: 800px; margin: 24px auto; background: #f4efe6; padding: 40px 44px; }
  h1 { font-weight: 500; font-size: 28px; margin: 8px 0 0; }
  h2 { font-size: 12px; letter-spacing: .18em; text-transform: uppercase; color: #5c5a52; font-weight: 600; margin: 28px 0 8px; }
  p, td, li { font-size: 14px; line-height: 1.55; }
  .kicker { font-size: 11px; letter-spacing: .28em; text-transform: uppercase; color: #5c5a52; }
  .legal { border: 1px solid #8a3b2a; background: #f7ebe4; padding: 14px 16px; margin: 20px 0; font-size: 14px; }
  .legal strong { display: block; margin-bottom: 6px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 8px 6px; border-bottom: 1px solid #d9d3c6; vertical-align: top; text-align: left; font-size: 13px; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .note td { color: #5c5a52; font-size: 13px; }
  .muted { color: #5c5a52; }
  .sign { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; margin-top: 28px; }
  .line { border-top: 1px solid #1a1c18; margin-top: 48px; padding-top: 8px; font-size: 13px; }
  .gaps { color: #8a3b2a; }
  @media print { body { background: white; } .sheet { margin: 0; padding: 12mm; } .no-print { display: none; } }
</style>
</head>
<body>
<main class="sheet">
  <p class="kicker">Vaulty · ${L("lawyerBriefKicker")}</p>
  <h1>${L("lawyerBriefTitle")}</h1>
  <p class="muted">${L("lawyerBriefLead")}</p>
  <p class="muted">${L("lawyerGenerated")} ${generated}</p>

  <div class="legal">
    <strong>${L("lawyerNotWill")}</strong>
    ${L("lawyerNotWillBody")}
  </div>
  <h2>${L("lawyerFormsTitle")}</h2>
  <p>${L("lawyerForms")}</p>
  <h2>${L("lawyerLimitsTitle")}</h2>
  <p>${L("lawyerLimits")}</p>

  <h2>${L("occupancy")}</h2>
  <p style="font-size:22px;margin:4px 0 0">${dash(vault.profile.fullName)}</p>
  <p class="muted">${L("born")}: ${fmtDate(vault.profile.dateOfBirth, lang)}</p>
  <p class="muted">${L("city")}: ${dash(vault.profile.city)} · ${L("occupation")}: ${dash(vault.profile.occupation)}</p>

  <h2>${L("maritalPanel")}</h2>
  <p>${L("maritalHint")}</p>
  ${warn ? `<p class="gaps">${esc(warn)}</p>` : ""}
  <table>
    <tbody>
      <tr><td>${L("maritalGross")}</td><td class="num">${esc(formatThb(split.gross, lang))}</td></tr>
      <tr><td>${L("maritalPool")}</td><td class="num">${esc(formatThb(split.marital, lang))}</td></tr>
      <tr><td>${L("maritalSpouseHalf")}${split.spouseName ? ` — ${esc(split.spouseName)}` : ""}</td><td class="num">${esc(formatThb(split.spouseHalf, lang))}</td></tr>
      <tr><td>${L("maritalSeparate")}</td><td class="num">${esc(formatThb(split.separate, lang))}</td></tr>
      <tr><td>${L("maritalUnknown")}</td><td class="num">${esc(formatThb(split.unknown, lang))}</td></tr>
      <tr><td><strong>${L("maritalEstate")}</strong></td><td class="num"><strong>${esc(formatThb(split.estate, lang))}</strong></td></tr>
    </tbody>
  </table>

  <h2>${L("lawyerGapsTitle")}</h2>
  <p class="muted">${L("lawyerGapsLead")} (${complete}/${vaultTasks(vault).length})</p>
  ${gapList}

  <h2>${L("heirs")}</h2>
  <p class="muted">${L("share")} ${share}% · ${L("netWorth")} ${esc(formatThb(worth, lang))} · ${L("maritalEstate")} ${esc(formatThb(split.estate, lang))}</p>
  <table>
    <thead><tr>
      <th>${L("name")}</th><th>${L("relationship")}</th><th class="num">${L("share")}</th>
      <th>${L("email")}</th><th>${L("phone")}</th>
    </tr></thead>
    <tbody>${heirRows}</tbody>
  </table>

  <h2>${L("taxTitle")}</h2>
  <p>${L("taxLead")}</p>
  <p class="muted">${L("taxHint")}</p>
  ${
    tax.anyoneLiable
      ? `<p><strong>${L("taxDue")}: ${esc(formatThb(tax.totalTax, lang))}</strong></p>`
      : `<p>${L("taxNone")}</p>`
  }
  <table>
    <thead><tr>
      <th>${L("name")}</th>
      <th>${L("taxReceived")}</th>
      <th>${L("taxExcluded")}</th>
      <th class="num">${L("taxDue")}</th>
    </tr></thead>
    <tbody>
      ${tax.rows
        .map(
          (r) => `<tr>
        <td>${esc(r.name)}</td>
        <td class="num">${esc(formatThb(r.received, lang))}</td>
        <td class="num">${esc(formatThb(r.excluded, lang))}</td>
        <td class="num">${r.band === "exempt" ? (r.relationship === "spouse" ? L("taxSpouseExempt") : L("taxNone")) : esc(formatThb(r.tax, lang))}</td>
      </tr>`,
        )
        .join("")}
    </tbody>
  </table>

  <h2>${L("assets")}</h2>
  <table>
    <thead><tr>
      <th>${L("name")}</th><th>${L("category")}</th><th>${L("maritalKind")}</th><th>${L("institution")}</th>
      <th>${L("identifier")}</th><th>${L("location")}</th>
      <th class="num">${L("value")}</th><th>${L("assignedHeirs")}</th>
    </tr></thead>
    <tbody>${assetRows}</tbody>
  </table>

  <h2>${L("willCustodyTitle")}</h2>
  <p>${esc(custodyPlainText(custody, lang))}</p>
  ${custody.copiesWhere.trim() ? `<p class="muted">${L("willCustodyCopies")}: ${esc(custody.copiesWhere)}</p>` : ""}
  ${custody.notes.trim() ? `<p>${esc(custody.notes)}</p>` : ""}
  ${custodyStatusNow === "home" ? `<p class="gaps">${L("willCustodyHomeWarn")}</p>` : ""}
  ${custody.place === "bank" ? `<p class="muted">${L("willCustodyBankNote")}</p>` : ""}
  <p class="muted">${L("willCustodyLegal")}</p>

  <h2>${L("lawyerWillDocs")}</h2>
  ${docList(willDocs)}

  <h2>${L("documents")}</h2>
  ${docList(otherDocs)}

  <h2>${L("executor")}</h2>
  <p>${dash(vault.access.executorName)}</p>
  <p class="muted">${dash(vault.access.executorRole)} · ${dash(vault.access.executorContact)}</p>
  <p class="muted">${L("emergency")}: ${dash(vault.access.emergencyName)} ${dash(vault.access.emergencyContact)}</p>
  ${vault.access.releaseNote ? `<p>${esc(vault.access.releaseNote)}</p>` : ""}

  <h2>${L("packetWishes")}</h2>
  ${wishes || `<p>${L("none")}</p>`}

  <h2>${L("letters")}</h2>
  <p class="muted">${L("lawyerLettersNote")}</p>
  ${letters}

  <h2>${L("lawyerHowTitle")}</h2>
  <ol>${checklist}</ol>

  <p class="muted">${L("packetSecretsOmitted")}</p>

  <h2>${L("lawyerSignTitle")}</h2>
  <p class="muted">${L("lawyerSignLead")}</p>
  <div class="sign">
    <div class="line">${L("lawyerSignOwner")}</div>
    <div class="line">${L("lawyerSignDate")}</div>
    <div class="line">${L("lawyerSignCounsel")}</div>
    <div class="line">${L("lawyerSignDate")}</div>
  </div>
</main>
<p class="no-print" style="text-align:center;padding:16px">
  <button onclick="window.print()">${L("printPacket")}</button>
</p>
</body></html>`;
}
