import type { Lang } from "./types.ts";
import { OPERATOR, sellerLabel } from "./operator.ts";

export const BILLING_TEST_MODE = true;
export const COMPANY_REGISTERED = OPERATOR.registered;
export const TRIAL_DAYS = 14;
export const YEAR_DAYS = 365;
export const PAST_DUE_DAYS = 7;
export const GRACE_DAYS = 30;
export const VAT_RATE = 0.07;

export type PlanCode = "free" | "care" | "estate" | "counsel";
export type SubStatus = "none" | "trialing" | "active" | "past_due" | "grace" | "paused" | "revoked";
export type DocKind = "receipt" | "tax_invoice" | "credit_note";
export type BillingFeature = "cloud_write" | "cloud_read" | "deadman_arm" | "deadman_line" | "tax_invoice";

export type PlanDef = {
  code: PlanCode;
  grossSatang: number;
  cloudVaults: number;
  deadmanLines: number;
  features: BillingFeature[];
};

export const PLANS: Record<PlanCode, PlanDef> = {
  free: { code: "free", grossSatang: 0, cloudVaults: 0, deadmanLines: 0, features: [] },
  care: {
    code: "care",
    grossSatang: 199_000,
    cloudVaults: 1,
    deadmanLines: 1,
    features: ["cloud_write", "cloud_read", "deadman_arm", "deadman_line"],
  },
  estate: {
    code: "estate",
    grossSatang: 499_000,
    cloudVaults: 3,
    deadmanLines: 3,
    features: ["cloud_write", "cloud_read", "deadman_arm", "deadman_line"],
  },
  counsel: {
    code: "counsel",
    grossSatang: 1_490_000,
    cloudVaults: 99,
    deadmanLines: 99,
    features: ["cloud_write", "cloud_read", "deadman_arm", "deadman_line", "tax_invoice"],
  },
};

export const PAID_PLANS: Exclude<PlanCode, "free">[] = ["care", "estate", "counsel"];

export const SELLER = {
  registered: OPERATOR.registered,
  testMode: BILLING_TEST_MODE,
  nameTh: sellerLabel("th"),
  nameEn: sellerLabel("en"),
  taxId: OPERATOR.taxId,
  addressTh: OPERATOR.registeredOfficeTh || "จะกรอกหลังจดนิติบุคคล",
  addressEn: OPERATOR.registeredOfficeEn || "To be filled after company registration",
};

export type BillingProfile = {
  legalName: string;
  address: string;
  taxId: string;
  branch: string;
  email: string;
};

export type BillingSubscription = {
  planCode: PlanCode;
  status: SubStatus;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  startedAt: string | null;
  endsAt: string | null;
  testMode: boolean;
};

export type BillingDocMeta = {
  id: string;
  docNo: string;
  kind: DocKind;
  planCode: PlanCode;
  grossSatang: number;
  baseSatang: number;
  vatSatang: number;
  status: string;
  createdAt: string;
  html: string;
};

export type BillingSnapshot = {
  testMode: boolean;
  companyRegistered: boolean;
  seller: typeof SELLER;
  subscription: BillingSubscription;
  resolved: SubStatus;
  features: BillingFeature[];
  profile: BillingProfile;
  documents: BillingDocMeta[];
  trialEligible: boolean;
};

export function emptyProfile(): BillingProfile {
  return { legalName: "", address: "", taxId: "", branch: "", email: "" };
}

export function emptySubscription(): BillingSubscription {
  return {
    planCode: "free",
    status: "none",
    trialStartedAt: null,
    trialEndsAt: null,
    startedAt: null,
    endsAt: null,
    testMode: true,
  };
}

export function isPlanCode(raw: unknown): raw is PlanCode {
  return raw === "free" || raw === "care" || raw === "estate" || raw === "counsel";
}

export function splitVat(grossSatang: number): { base: number; vat: number; gross: number } {
  const gross = Math.max(0, Math.round(grossSatang));
  const base = Math.round(gross / (1 + VAT_RATE));
  return { base, vat: gross - base, gross };
}

export function formatSatang(satang: number, lang: Lang): string {
  const n = satang / 100;
  return n.toLocaleString(lang === "th" ? "th-TH" : "en-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function isThaiTaxId(raw: string): boolean {
  return /^\d{13}$/.test(raw.trim());
}

export function parseProfile(raw: unknown): BillingProfile {
  const o = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const str = (k: string, max: number) =>
    String(o[k] ?? "")
      .replace(/[\r\n\0\t]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, max);
  const digits = String(o.taxId ?? "").replace(/\D/g, "").slice(0, 13);
  return {
    legalName: str("legalName", 120),
    address: str("address", 240),
    taxId: digits,
    branch: str("branch", 80),
    email: str("email", 120),
  };
}

export function profileReadyForTaxInvoice(p: BillingProfile): boolean {
  return Boolean(p.legalName && p.address && isThaiTaxId(p.taxId));
}

export function addDaysIso(from: Date, days: number): string {
  return new Date(from.getTime() + days * 86_400_000).toISOString();
}

export function resolveStatus(sub: BillingSubscription, now = Date.now()): SubStatus {
  if (sub.status === "revoked" || sub.status === "paused") return sub.status;
  if (sub.status === "trialing") {
    if (sub.trialEndsAt && now < Date.parse(sub.trialEndsAt)) return "trialing";
    return "none";
  }
  if (sub.status === "active" || sub.status === "past_due" || sub.status === "grace") {
    if (!sub.endsAt) return "active";
    const ended = Date.parse(sub.endsAt);
    if (now < ended) return "active";
    if (now < ended + PAST_DUE_DAYS * 86_400_000) return "past_due";
    if (now < ended + (PAST_DUE_DAYS + GRACE_DAYS) * 86_400_000) return "grace";
    return "none";
  }
  return "none";
}

export function effectivePlan(sub: BillingSubscription, now = Date.now()): PlanCode {
  const status = resolveStatus(sub, now);
  if (status === "trialing") return "care";
  if (status === "active" || status === "past_due") return sub.planCode;
  return "free";
}

export function effectiveFeatures(sub: BillingSubscription, now = Date.now()): BillingFeature[] {
  const status = resolveStatus(sub, now);
  if (status === "grace") return ["cloud_read"];
  const plan = effectivePlan(sub, now);
  return PLANS[plan].features;
}

export function hasFeature(sub: BillingSubscription, feature: BillingFeature, now = Date.now()): boolean {
  return effectiveFeatures(sub, now).includes(feature);
}

export function trialEligible(sub: BillingSubscription): boolean {
  return !sub.trialStartedAt && resolveStatus(sub) === "none" && sub.planCode === "free";
}

/** Same active plan again must not mint another pair of test documents. */
export function activationNoop(prev: BillingSubscription, plan: PlanCode, now = Date.now()): boolean {
  return resolveStatus(prev, now) === "active" && prev.planCode === plan;
}

export function docSeriesPrefix(kind: "R" | "T" | "C", at = new Date()): string {
  const yymm = `${String(at.getFullYear()).slice(2)}${String(at.getMonth() + 1).padStart(2, "0")}`;
  return `VT-${kind}-${yymm}-`;
}

export function formatDocNo(kind: "R" | "T" | "C", n: number, at = new Date()): string {
  const serial = Number.isFinite(n) && n >= 1 ? Math.min(Math.floor(n), 99_999) : 1;
  return `${docSeriesPrefix(kind, at)}${String(serial).padStart(5, "0")}`;
}

export function nextDocNo(kind: "R" | "T" | "C", last: string | undefined, at = new Date()): string {
  const prefix = docSeriesPrefix(kind, at);
  let n = 1;
  if (last && last.startsWith(prefix)) {
    const parsed = Number(last.slice(prefix.length));
    if (Number.isFinite(parsed)) n = parsed + 1;
  }
  return formatDocNo(kind, n, at);
}

function esc(value: string): string {
  return value
    .replaceAll("&", "&" + "amp;")
    .replaceAll("<", "&" + "lt;")
    .replaceAll(">", "&" + "gt;")
    .replaceAll('"', "&" + "quot;");
}

export function documentHtml(input: {
  kind: DocKind;
  docNo: string;
  plan: PlanCode;
  profile: BillingProfile;
  createdAt: string;
  amounts: { base: number; vat: number; gross: number };
  lang: Lang;
}): string {
  const th = input.lang === "th";
  const sellerName = th ? SELLER.nameTh : SELLER.nameEn;
  const sellerAddr = th ? SELLER.addressTh : SELLER.addressEn;
  const title =
    input.kind === "tax_invoice"
      ? th
        ? "ใบกำกับภาษี (เอกสารทดสอบ)"
        : "Tax invoice (test document)"
      : input.kind === "credit_note"
        ? th
          ? "ใบลดหนี้ (เอกสารทดสอบ)"
          : "Credit note (test document)"
        : th
          ? "ใบเสร็จรับเงิน (เอกสารทดสอบ)"
          : "Receipt (test document)";
  const stamp = th
    ? "เอกสารทดสอบ — ไม่ใช่ใบเสร็จหรือใบกำกับภาษีตามประมวลรัษฎากร ไม่มีการเก็บเงินจริง"
    : "Test document — not a legal receipt or tax invoice. No money was collected.";
  const planLabel = input.plan.toUpperCase();
  const created = new Date(input.createdAt).toLocaleString(th ? "th-TH" : "en-GB");
  const buyer = input.profile.legalName || (th ? "ผู้ซื้อ (ยังไม่ระบุ)" : "Buyer (not set)");
  return `<!doctype html>
<html lang="${th ? "th" : "en"}">
<head>
  <meta charset="utf-8"/>
  <title>${esc(title)} ${esc(input.docNo)}</title>
  <style>
    body { font-family: "Sarabun", "Tahoma", sans-serif; color: #0b1f33; max-width: 720px; margin: 40px auto; padding: 0 20px; }
    h1 { font-size: 22px; margin: 0 0 8px; }
    .stamp { border: 2px solid #8a6a32; color: #8a6a32; padding: 8px 12px; font-size: 13px; margin: 16px 0 24px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    td, th { text-align: left; padding: 8px 0; border-bottom: 1px solid #d4d9de; font-size: 14px; }
    .muted { color: #5c6b7a; font-size: 13px; }
    .right { text-align: right; }
  </style>
</head>
<body>
  <p class="muted">VAULTY</p>
  <h1>${esc(title)}</h1>
  <p>${th ? "เลขที่" : "No."} <strong>${esc(input.docNo)}</strong> · ${esc(created)}</p>
  <div class="stamp">${esc(stamp)}</div>
  <p><strong>${th ? "ผู้ขาย" : "Seller"}</strong><br/>${esc(sellerName)}<br/>${esc(sellerAddr)}<br/>${th ? "เลขผู้เสียภาษี" : "Tax ID"}: ${SELLER.taxId || "—"}</p>
  <p><strong>${th ? "ผู้ซื้อ" : "Buyer"}</strong><br/>${esc(buyer)}<br/>${esc(input.profile.address || "—")}<br/>${th ? "เลขผู้เสียภาษี" : "Tax ID"}: ${esc(input.profile.taxId || "—")}<br/>${esc(input.profile.branch || (th ? "สำนักงานใหญ่" : "Head office"))}</p>
  <table>
    <thead><tr><th>${th ? "รายการ" : "Item"}</th><th class="right">${th ? "จำนวน" : "Amount"}</th></tr></thead>
    <tbody>
      <tr><td>Vaulty ${esc(planLabel)} ${th ? "รายปี (ทดสอบ)" : "annual (test)"}</td><td class="right">${esc(formatSatang(input.amounts.base, input.lang))}</td></tr>
      <tr><td>VAT 7%</td><td class="right">${esc(formatSatang(input.amounts.vat, input.lang))}</td></tr>
      <tr><th>${th ? "รวมทั้งสิ้น" : "Total"}</th><th class="right">${esc(formatSatang(input.amounts.gross, input.lang))}</th></tr>
    </tbody>
  </table>
  <p class="muted">${th ? "ช่องทางชำระ: โหมดทดสอบ — ไม่ตัดบัตร ไม่โอนเงิน" : "Payment: test mode — no card charge, no transfer"}</p>
  <p class="muted">${th ? "รหัสคลังไม่อยู่ในเอกสารนี้ และไม่ขึ้นเซิร์ฟเวอร์" : "The vault code is not in this document and never goes to the server."}</p>
</body>
</html>`;
}
