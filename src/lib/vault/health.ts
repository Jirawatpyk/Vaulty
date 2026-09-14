import { isEncryptedBlob } from "./crypto.ts";
import type { I18nKey } from "./i18n";

export type ControlResult = {
  key: I18nKey;
  ok: boolean;
  warn?: boolean;
};

export type HealthReport = {
  controls: ControlResult[];
  blobBytes: number;
  version: number | null;
  lastUnlock: string | null;
  failedUnlocks: number;
};

export function evaluateHealth(input: {
  blobRaw: string | null;
  lockoutUntil: number;
  failedAttempts: number;
  lastUnlock: string | null;
}): HealthReport {
  const cryptoOk = typeof crypto !== "undefined" && Boolean(crypto.subtle);
  let storageOk = false;
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("vaulty.ping", "1");
      window.localStorage.removeItem("vaulty.ping");
      storageOk = true;
    }
  } catch {
    storageOk = false;
  }
  const secure = typeof window === "undefined" ? true : window.isSecureContext;

  let blobOk = true;
  let version: number | null = null;
  const blobBytes = input.blobRaw?.length ?? 0;
  if (input.blobRaw) {
    try {
      const parsed: unknown = JSON.parse(input.blobRaw);
      blobOk = isEncryptedBlob(parsed);
      version = isEncryptedBlob(parsed) ? parsed.v : null;
    } catch {
      blobOk = false;
    }
  }

  const lockedOut = input.lockoutUntil > Date.now();

  return {
    controls: [
      { key: "healthCrypto", ok: cryptoOk },
      { key: "healthStorage", ok: storageOk },
      { key: "healthContext", ok: secure },
      { key: "healthBlob", ok: blobOk },
      { key: "healthLockout", ok: true, warn: lockedOut },
    ],
    blobBytes,
    version,
    lastUnlock: input.lastUnlock,
    failedUnlocks: input.failedAttempts,
  };
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
