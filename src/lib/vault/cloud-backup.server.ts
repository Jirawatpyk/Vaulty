import { getSql } from "@/lib/db";
import { cloudFingerprint, emptyCloudMeta, parseSealedPayload, type CloudBackupMeta, type CloudBackupPull } from "./cloud-backup.ts";

type MetaRow = {
  fingerprint: string;
  bytes: number;
  owner_label: string;
  updated_at: string;
};

type Row = MetaRow & { blob: string };

function toMeta(row: MetaRow | undefined): CloudBackupMeta {
  if (!row) return emptyCloudMeta();
  return {
    exists: true,
    fingerprint: row.fingerprint,
    updatedAt: String(row.updated_at),
    ownerLabel: row.owner_label || null,
    bytes: Number(row.bytes) || 0,
  };
}

export async function readCloudMeta(userId: string): Promise<CloudBackupMeta> {
  const sql = await getSql();
  const rows = await sql<MetaRow>`
    select fingerprint, bytes, owner_label, updated_at
    from cloud_backup where user_id = ${userId}
  `;
  return toMeta(rows[0]);
}

export async function pullCloudBackup(userId: string): Promise<CloudBackupPull> {
  const sql = await getSql();
  const rows = await sql<Row>`
    select blob, fingerprint, bytes, owner_label, updated_at
    from cloud_backup where user_id = ${userId}
  `;
  const row = rows[0];
  if (!row) return { ...emptyCloudMeta(), blob: null };
  return { ...toMeta(row), blob: row.blob };
}

export async function putCloudBackup(
  userId: string,
  raw: string,
  ownerLabel: string,
): Promise<CloudBackupMeta> {
  const parsed = parseSealedPayload(raw);
  if (!parsed.ok) throw new Error(parsed.error);
  const fingerprint = await cloudFingerprint(parsed.normalized);
  const label = ownerLabel.trim().slice(0, 80);
  const bytes = parsed.normalized.length;
  const sql = await getSql();
  await sql`
    insert into cloud_backup (user_id, blob, fingerprint, bytes, owner_label, updated_at, created_at)
    values (${userId}, ${parsed.normalized}, ${fingerprint}, ${bytes}, ${label}, now(), now())
    on conflict (user_id) do update set
      blob = excluded.blob,
      fingerprint = excluded.fingerprint,
      bytes = excluded.bytes,
      owner_label = excluded.owner_label,
      updated_at = now()
  `;
  return {
    exists: true,
    fingerprint,
    updatedAt: new Date().toISOString(),
    ownerLabel: label || null,
    bytes,
  };
}

export async function deleteCloudBackup(userId: string): Promise<CloudBackupMeta> {
  const sql = await getSql();
  await sql`delete from cloud_backup where user_id = ${userId}`;
  return emptyCloudMeta();
}
