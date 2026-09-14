import { randomUUID } from "node:crypto";
import { getSql } from "@/lib/db";
import {
  BILLING_TEST_MODE,
  COMPANY_REGISTERED,
  PAID_PLANS,
  PLANS,
  SELLER,
  TRIAL_DAYS,
  YEAR_DAYS,
  addDaysIso,
  documentHtml,
  effectiveFeatures,
  emptyProfile,
  emptySubscription,
  isPlanCode,
  nextDocNo,
  parseProfile,
  resolveStatus,
  splitVat,
  trialEligible,
  type BillingDocMeta,
  type BillingFeature,
  type BillingProfile,
  type BillingSnapshot,
  type BillingSubscription,
  type DocKind,
  type PlanCode,
  type SubStatus,
} from "./billing.ts";

type SubRow = {
  plan_code: string;
  status: string;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  started_at: string | null;
  ends_at: string | null;
  test_mode: boolean;
};

type ProfileRow = {
  legal_name: string;
  address: string;
  tax_id: string;
  branch: string;
  email: string;
};

type DocRow = {
  id: string;
  doc_no: string;
  kind: string;
  plan_code: string;
  gross_satang: number;
  base_satang: number;
  vat_satang: number;
  status: string;
  payload: string;
  created_at: string;
};

function isoStamp(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function asSub(row: SubRow | undefined): BillingSubscription {
  if (!row) return emptySubscription();
  return {
    planCode: isPlanCode(row.plan_code) ? row.plan_code : "free",
    status: (["none", "trialing", "active", "past_due", "grace", "paused", "revoked"].includes(row.status)
      ? row.status
      : "none") as SubStatus,
    trialStartedAt: isoStamp(row.trial_started_at),
    trialEndsAt: isoStamp(row.trial_ends_at),
    startedAt: isoStamp(row.started_at),
    endsAt: isoStamp(row.ends_at),
    testMode: row.test_mode !== false,
  };
}

function asProfile(row: ProfileRow | undefined): BillingProfile {
  if (!row) return emptyProfile();
  return parseProfile({
    legalName: row.legal_name,
    address: row.address,
    taxId: row.tax_id,
    branch: row.branch,
    email: row.email,
  });
}

function asDoc(row: DocRow): BillingDocMeta {
  let html = "";
  try {
    const parsed = JSON.parse(row.payload) as { html?: string };
    html = typeof parsed.html === "string" ? parsed.html : "";
  } catch {
    html = "";
  }
  return {
    id: row.id,
    docNo: row.doc_no,
    kind: (row.kind === "tax_invoice" || row.kind === "credit_note" ? row.kind : "receipt") as DocKind,
    planCode: isPlanCode(row.plan_code) ? row.plan_code : "free",
    grossSatang: Number(row.gross_satang) || 0,
    baseSatang: Number(row.base_satang) || 0,
    vatSatang: Number(row.vat_satang) || 0,
    status: row.status,
    createdAt: String(row.created_at),
    html,
  };
}

async function readSub(userId: string): Promise<BillingSubscription> {
  const sql = await getSql();
  const rows = await sql<SubRow>`
    select plan_code, status, trial_started_at, trial_ends_at, started_at, ends_at, test_mode
    from billing_subscription where user_id = ${userId}
  `;
  return asSub(rows[0]);
}

async function readProfile(userId: string): Promise<BillingProfile> {
  const sql = await getSql();
  const rows = await sql<ProfileRow>`
    select legal_name, address, tax_id, branch, email from billing_profile where user_id = ${userId}
  `;
  return asProfile(rows[0]);
}

async function readDocs(userId: string): Promise<BillingDocMeta[]> {
  const sql = await getSql();
  const rows = await sql<DocRow>`
    select id, doc_no, kind, plan_code, gross_satang, base_satang, vat_satang, status, payload, created_at
    from billing_document where user_id = ${userId} order by created_at desc limit 20
  `;
  return rows.map(asDoc);
}

async function writeSub(userId: string, sub: BillingSubscription): Promise<void> {
  const sql = await getSql();
  await sql`
    insert into billing_subscription (
      user_id, plan_code, status, trial_started_at, trial_ends_at, started_at, ends_at, test_mode, updated_at
    ) values (
      ${userId}, ${sub.planCode}, ${sub.status}, ${sub.trialStartedAt}, ${sub.trialEndsAt},
      ${sub.startedAt}, ${sub.endsAt}, ${sub.testMode}, now()
    )
    on conflict (user_id) do update set
      plan_code = excluded.plan_code,
      status = excluded.status,
      trial_started_at = excluded.trial_started_at,
      trial_ends_at = excluded.trial_ends_at,
      started_at = excluded.started_at,
      ends_at = excluded.ends_at,
      test_mode = excluded.test_mode,
      updated_at = now()
  `;
}

function snapshotOf(sub: BillingSubscription, profile: BillingProfile, documents: BillingDocMeta[]): BillingSnapshot {
  const resolved = resolveStatus(sub);
  return {
    testMode: BILLING_TEST_MODE,
    companyRegistered: COMPANY_REGISTERED,
    seller: SELLER,
    subscription: sub,
    resolved,
    features: effectiveFeatures(sub),
    profile,
    documents,
    trialEligible: trialEligible(sub),
  };
}

export async function loadSnapshot(userId: string): Promise<BillingSnapshot> {
  const [sub, profile, documents] = await Promise.all([readSub(userId), readProfile(userId), readDocs(userId)]);
  return snapshotOf(sub, profile, documents);
}

export async function maybeStartTrial(userId: string): Promise<BillingSnapshot> {
  const sub = await readSub(userId);
  if (!trialEligible(sub)) return loadSnapshot(userId);
  const now = new Date();
  const next: BillingSubscription = {
    ...sub,
    planCode: "care",
    status: "trialing",
    trialStartedAt: now.toISOString(),
    trialEndsAt: addDaysIso(now, TRIAL_DAYS),
    testMode: true,
  };
  await writeSub(userId, next);
  return loadSnapshot(userId);
}

export async function requireFeature(userId: string, feature: BillingFeature): Promise<BillingSnapshot> {
  let snap = await loadSnapshot(userId);
  if (!snap.features.includes(feature)) snap = await maybeStartTrial(userId);
  if (!snap.features.includes(feature)) throw new Error("plan");
  return snap;
}

async function issueDocument(
  userId: string,
  kind: DocKind,
  plan: PlanCode,
  profile: BillingProfile,
  lang: "th" | "en",
): Promise<BillingDocMeta> {
  const amounts = splitVat(PLANS[plan].grossSatang);
  const prefix = kind === "tax_invoice" ? "T" : kind === "credit_note" ? "C" : "R";
  const sql = await getSql();
  const yymm = `${String(new Date().getFullYear()).slice(2)}${String(new Date().getMonth() + 1).padStart(2, "0")}`;
  const like = `VT-${prefix}-${yymm}-%`;
  const last = await sql<{ doc_no: string }>`
    select doc_no from billing_document where doc_no like ${like} order by doc_no desc limit 1
  `;
  const docNo = nextDocNo(prefix, last[0]?.doc_no);
  const createdAt = new Date().toISOString();
  const html = documentHtml({ kind, docNo, plan, profile, createdAt, amounts, lang });
  const id = randomUUID();
  const payload = JSON.stringify({ html, test: true, seller: SELLER.nameTh });
  await sql`
    insert into billing_document (
      id, user_id, doc_no, kind, plan_code, gross_satang, base_satang, vat_satang, status, payload, created_at
    ) values (
      ${id}, ${userId}, ${docNo}, ${kind}, ${plan}, ${amounts.gross}, ${amounts.base}, ${amounts.vat},
      ${"test"}, ${payload}, ${createdAt}
    )
  `;
  return {
    id,
    docNo,
    kind,
    planCode: plan,
    grossSatang: amounts.gross,
    baseSatang: amounts.base,
    vatSatang: amounts.vat,
    status: "test",
    createdAt,
    html,
  };
}

export async function activateTestPlan(userId: string, plan: PlanCode, lang: "th" | "en"): Promise<BillingSnapshot> {
  if (!BILLING_TEST_MODE) throw new Error("live");
  if (!PAID_PLANS.includes(plan as Exclude<PlanCode, "free">)) throw new Error("plan");
  const now = new Date();
  const prev = await readSub(userId);
  const next: BillingSubscription = {
    ...prev,
    planCode: plan,
    status: "active",
    startedAt: now.toISOString(),
    endsAt: addDaysIso(now, YEAR_DAYS),
    testMode: true,
    trialStartedAt: prev.trialStartedAt ?? now.toISOString(),
    trialEndsAt: prev.trialEndsAt,
  };
  await writeSub(userId, next);
  const profile = await readProfile(userId);
  await issueDocument(userId, "receipt", plan, profile, lang);
  await issueDocument(userId, "tax_invoice", plan, profile, lang);
  return loadSnapshot(userId);
}

export async function startTrial(userId: string): Promise<BillingSnapshot> {
  return maybeStartTrial(userId);
}

export async function cancelTestPlan(userId: string): Promise<BillingSnapshot> {
  const prev = await readSub(userId);
  await writeSub(userId, { ...prev, status: "paused", planCode: prev.planCode === "free" ? "free" : prev.planCode });
  return loadSnapshot(userId);
}

export async function saveProfile(userId: string, raw: unknown): Promise<BillingSnapshot> {
  const profile = parseProfile(raw);
  if (profile.taxId && !/^\d{13}$/.test(profile.taxId)) throw new Error("tax_id");
  const sql = await getSql();
  await sql`
    insert into billing_profile (user_id, legal_name, address, tax_id, branch, email, updated_at)
    values (${userId}, ${profile.legalName}, ${profile.address}, ${profile.taxId}, ${profile.branch}, ${profile.email}, now())
    on conflict (user_id) do update set
      legal_name = excluded.legal_name,
      address = excluded.address,
      tax_id = excluded.tax_id,
      branch = excluded.branch,
      email = excluded.email,
      updated_at = now()
  `;
  return loadSnapshot(userId);
}

export async function cancelBillingOnErase(userId: string): Promise<void> {
  const prev = await readSub(userId);
  if (prev.status === "none" && prev.planCode === "free") return;
  await writeSub(userId, { ...prev, status: "revoked" });
}
