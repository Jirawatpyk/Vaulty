import { isEncryptedBlob } from "./crypto.ts";
import type { LockoutState, SecEvent, SecKind } from "./lockout.ts";

export type BlobHealth = "empty" | "sealed" | "corrupt";

const SEC_KINDS = new Set<SecKind>([
  "unlock",
  "lock",
  "fail",
  "export",
  "import",
  "wipe",
  "pin",
  "hide",
  "checkin",
  "idle",
]);

export function classifySealed(raw: string | null): BlobHealth {
  if (!raw) return "empty";
  try {
    const parsed: unknown = JSON.parse(raw);
    return isEncryptedBlob(parsed) ? "sealed" : "corrupt";
  } catch {
    return "corrupt";
  }
}

export function parseLockout(raw: string | null): LockoutState {
  if (!raw) return { fails: 0, until: 0 };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { fails: 0, until: 0 };
    }
    const o = parsed as Record<string, unknown>;
    const fails = Math.min(50, Math.max(0, Math.floor(Number(o.fails)) || 0));
    const until = Math.max(0, Math.floor(Number(o.until)) || 0);
    return { fails, until };
  } catch {
    return { fails: 0, until: 0 };
  }
}

export function parseSecEvents(raw: string | null): SecEvent[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const out: SecEvent[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== "object") continue;
      const at = (item as { at?: unknown }).at;
      const kind = (item as { kind?: unknown }).kind;
      if (typeof at !== "string" || typeof kind !== "string") continue;
      if (!SEC_KINDS.has(kind as SecKind)) continue;
      out.push({ at, kind: kind as SecKind });
      if (out.length >= 50) break;
    }
    return out;
  } catch {
    return [];
  }
}

export function recoverAutoLock(raw: string | null): number {
  const n = Number(raw || "5");
  if (!Number.isFinite(n) || n < 1) return 5;
  return Math.min(30, Math.round(n));
}

export function shouldCommitPersist(writeGen: number, liveGen: number, hasSession: boolean): boolean {
  return hasSession && writeGen === liveGen;
}

export function canRestore(raw: string): boolean {
  if (typeof raw !== "string" || raw.length === 0) return false;
  return classifySealed(raw) === "sealed";
}
