import { getSql } from "@/lib/db";
import {
  emptyConsent,
  LEGAL_VERSION,
  parseConsent,
  type ConsentRecord,
} from "./legal.ts";

type Row = {
  version: string;
  terms: boolean;
  privacy: boolean;
  account: boolean;
  cloud: boolean;
  notify: boolean;
  at: string;
  withdrawn_at: string | null;
};

function toRecord(row: Row | undefined): ConsentRecord {
  if (!row) return emptyConsent();
  return parseConsent({
    version: row.version,
    terms: row.terms,
    privacy: row.privacy,
    account: row.account,
    cloud: row.cloud,
    notify: row.notify,
    at: String(row.at),
    withdrawnAt: row.withdrawn_at ? String(row.withdrawn_at) : null,
  });
}

export async function readConsent(userId: string): Promise<ConsentRecord> {
  const sql = await getSql();
  const rows = await sql<Row>`
    select version, terms, privacy, account, cloud, notify, at, withdrawn_at
    from legal_consent where user_id = ${userId}
  `;
  return toRecord(rows[0]);
}

export async function saveConsent(userId: string, record: ConsentRecord): Promise<ConsentRecord> {
  const parsed = parseConsent(record);
  const sql = await getSql();
  await sql`
    insert into legal_consent (
      user_id, version, terms, privacy, account, cloud, notify, at, withdrawn_at
    ) values (
      ${userId}, ${parsed.version || LEGAL_VERSION}, ${parsed.terms}, ${parsed.privacy},
      ${parsed.account}, ${parsed.cloud}, ${parsed.notify},
      ${parsed.at || new Date().toISOString()}, ${parsed.withdrawnAt}
    )
    on conflict (user_id) do update set
      version = excluded.version,
      terms = excluded.terms,
      privacy = excluded.privacy,
      account = excluded.account,
      cloud = excluded.cloud,
      notify = excluded.notify,
      at = excluded.at,
      withdrawn_at = excluded.withdrawn_at
  `;
  return readConsent(userId);
}

export async function eraseServerPersonalData(userId: string): Promise<ConsentRecord> {
  const sql = await getSql();
  await sql`delete from cloud_backup where user_id = ${userId}`;
  await sql`delete from deadman_outbox where user_id = ${userId}`;
  await sql`delete from deadman_switch where user_id = ${userId}`;
  const { cancelBillingOnErase } = await import("./billing.server");
  await cancelBillingOnErase(userId);
  const withdrawn: ConsentRecord = {
    version: LEGAL_VERSION,
    at: new Date().toISOString(),
    terms: false,
    privacy: false,
    account: false,
    cloud: false,
    notify: false,
    withdrawnAt: new Date().toISOString(),
  };
  await saveConsent(userId, withdrawn);
  return withdrawn;
}
