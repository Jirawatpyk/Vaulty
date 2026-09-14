import { lsGet, lsRemove, lsSet } from "./storage.ts";

export const EXPORT_AT_KEY = "vaulty.exportedAt";
export const NEED_BACKUP_KEY = "vaulty.needBackup";
export const CARD_AT_KEY = "vaulty.cardAt";
export const BACKUP_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export type BackupReason = "never" | "stale" | "pin" | null;

export function markExported(now = Date.now()): void {
  lsSet(EXPORT_AT_KEY, String(now));
  lsRemove(NEED_BACKUP_KEY);
}

export function markBackupNeeded(): void {
  lsSet(NEED_BACKUP_KEY, "1");
}

export function backupDue(now = Date.now()): boolean {
  return backupReason(now) !== null;
}

export function clearBackupMeta(): void {
  lsRemove(EXPORT_AT_KEY);
  lsRemove(NEED_BACKUP_KEY);
  lsRemove(CARD_AT_KEY);
}

export function lastExportAt(): number | null {
  const raw = lsGet(EXPORT_AT_KEY);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function backupReason(now = Date.now()): BackupReason {
  if (lsGet(NEED_BACKUP_KEY) === "1") return "pin";
  const last = lastExportAt();
  if (!last) return "never";
  if (now - last >= BACKUP_MAX_AGE_MS) return "stale";
  return null;
}

export function markCardSaved(now = Date.now()): void {
  lsSet(CARD_AT_KEY, String(now));
}

export function lastCardAt(): number | null {
  const raw = lsGet(CARD_AT_KEY);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function recoveryReady(): boolean {
  return lastExportAt() !== null && lastCardAt() !== null;
}
