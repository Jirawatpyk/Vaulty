import { isEncryptedBlob, type EncryptedBlob } from "./crypto.ts";
import { MAX_BLOB_CHARS } from "./storage.ts";

export const CLOUD_MAX_CHARS = MAX_BLOB_CHARS;

export type CloudBackupMeta = {
  exists: boolean;
  fingerprint: string | null;
  updatedAt: string | null;
  ownerLabel: string | null;
  bytes: number;
};

export type CloudBackupPull = CloudBackupMeta & {
  blob: string | null;
};

export function emptyCloudMeta(): CloudBackupMeta {
  return { exists: false, fingerprint: null, updatedAt: null, ownerLabel: null, bytes: 0 };
}

export type SealedParse =
  | { ok: true; normalized: string; blob: EncryptedBlob }
  | { ok: false; error: "empty" | "size" | "json" | "not_sealed" | "plaintext" };

export function parseSealedPayload(raw: unknown): SealedParse {
  if (typeof raw !== "string" || !raw.trim()) return { ok: false, error: "empty" };
  if (raw.length > CLOUD_MAX_CHARS) return { ok: false, error: "size" };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: "json" };
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false, error: "not_sealed" };
  }
  const o = parsed as Record<string, unknown>;
  if ("profile" in o || "assets" in o || "pin" in o || "willCustody" in o) {
    return { ok: false, error: "plaintext" };
  }
  if (!isEncryptedBlob(parsed)) return { ok: false, error: "not_sealed" };
  const blob: EncryptedBlob = { v: parsed.v, salt: parsed.salt, iv: parsed.iv, data: parsed.data };
  return { ok: true, normalized: JSON.stringify(blob), blob };
}

export async function cloudFingerprint(raw: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 12);
}
