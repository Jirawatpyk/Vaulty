export const FIRE_COOLDOWN_MS = 20 * 60 * 60 * 1000;
export const FIRE_BATCH_SIZE = 8;

export type SwitchLang = "th" | "en";

export type ArmInput = {
  email: string;
  lineToken?: string;
  lineTo?: string;
  webhookUrl?: string;
  ownerLabel: string;
  lang: SwitchLang;
  intervalDays: number;
};

export type DeadmanPublic = {
  armed: boolean;
  email: string;
  hasLine: boolean;
  hasWebhook: boolean;
  intervalDays: number;
  lastPing: string;
  dueAt: string;
  lastFired: string | null;
  lastStatus: string | null;
};

const BLOCKED_WEBHOOK_HOSTS = new Set([
  "localhost",
  "localhost.localdomain",
  "metadata.google.internal",
  "metadata.goog",
  "metadata",
  "kubernetes.default",
  "kubernetes.default.svc",
  "kubernetes.default.svc.cluster.local",
]);

export function nextDueAt(fromMs: number, intervalDays: number): string {
  const days = Math.min(365, Math.max(1, Math.round(intervalDays) || 30));
  return new Date(fromMs + days * 24 * 60 * 60 * 1000).toISOString();
}

export function shouldFire(input: {
  armed: boolean;
  dueAt: string | Date;
  lastFired: string | Date | null;
  now?: number;
}): boolean {
  if (!input.armed) return false;
  const now = input.now ?? Date.now();
  const due = new Date(input.dueAt).getTime();
  if (!Number.isFinite(due) || due > now) return false;
  if (!input.lastFired) return true;
  const last = new Date(input.lastFired).getTime();
  if (!Number.isFinite(last)) return true;
  return now - last >= FIRE_COOLDOWN_MS;
}

export function sanitizeNoticeLabel(value: string): string {
  return value.replace(/[\r\n\0\t]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

export function switchMessage(ownerLabel: string, lang: SwitchLang): string {
  const name = sanitizeNoticeLabel(ownerLabel) || "Vaulty";
  if (lang === "th") {
    return `Vaulty: คลังของ ${name} เลยกำหนดเช็คอินแล้ว โปรดเปิดแอปบนเครื่องที่เก็บคลัง หรือติดต่อผู้จัดการมรดก — อย่าใส่รหัสในข้อความนี้`;
  }
  return `Vaulty: ${name}’s vault missed a check-in. Open the app on the device that holds the vault, or contact the executor. Do not put the passcode in this message.`;
}

export function switchSubject(ownerLabel: string, lang: SwitchLang): string {
  const name = sanitizeNoticeLabel(ownerLabel) || "vault";
  return lang === "th" ? `Vaulty — เลยกำหนดเช็คอิน (${name})` : `Vaulty — check-in overdue (${name})`;
}

export function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at < 1) return "***";
  const user = email.slice(0, at);
  const domain = email.slice(at);
  const keep = user.slice(0, 1);
  return `${keep}***${domain}`;
}

export function isHttpsUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "https:";
  } catch {
    return false;
  }
}

export function isPrivateIpv4(ip: string): boolean {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(ip);
  if (!m) return false;
  const oct = [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])];
  if (oct.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return false;
  const [a, b] = oct;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a === 198 && (b === 18 || b === 19)) return true;
  if (a === 255) return true;
  return false;
}

export function isPrivateAddress(address: string): boolean {
  const a = address.toLowerCase().replace(/^\[|\]$/g, "").split("%")[0] ?? "";
  if (a.includes(".")) {
    const v4 = a.includes(":") ? a.slice(a.lastIndexOf(":") + 1) : a;
    if (isPrivateIpv4(v4)) return true;
  }
  if (a === "::1" || a === "::" || a === "0:0:0:0:0:0:0:1") return true;
  if (!a.includes(":")) return false;
  const head = a.split(":")[0] ?? "";
  if (head.startsWith("fc") || head.startsWith("fd")) return true;
  if (/^fe[89ab]/.test(head)) return true;
  return false;
}

export function isBlockedWebhookHost(hostname: string): boolean {
  const host = hostname.replace(/^\[|\]$/g, "").replace(/\.$/, "").toLowerCase();
  if (!host) return true;
  if (BLOCKED_WEBHOOK_HOSTS.has(host)) return true;
  if (host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal") || host.endsWith(".arpa")) {
    return true;
  }
  if (/^\d+$/.test(host) || /^0x[0-9a-f]+$/i.test(host)) return true;
  return isPrivateAddress(host);
}

export function assertSafeWebhookUrl(value: string): URL {
  let u: URL;
  try {
    u = new URL(value);
  } catch {
    throw new Error("webhook must be https");
  }
  if (u.protocol !== "https:") throw new Error("webhook must be https");
  if (u.username || u.password) throw new Error("webhook host not allowed");
  if (isBlockedWebhookHost(u.hostname)) throw new Error("webhook host not allowed");
  return u;
}

export function isSafeWebhookUrl(value: string): boolean {
  try {
    assertSafeWebhookUrl(value);
    return true;
  } catch {
    return false;
  }
}

export function sanitizeInterval(days: unknown): number {
  const n = Math.round(Number(days));
  if (!Number.isFinite(n)) return 30;
  return Math.min(365, Math.max(1, n));
}

export function bearerMatches(header: string | null | undefined, secret: string | undefined): boolean {
  if (!secret) return false;
  const expected = `Bearer ${secret}`;
  const got = header ?? "";
  const len = Math.max(expected.length, got.length);
  let diff = expected.length ^ got.length;
  for (let i = 0; i < len; i++) {
    diff |= (expected.charCodeAt(i) || 0) ^ (got.charCodeAt(i) || 0);
  }
  return diff === 0;
}

/** Preview may use the well-known local secret. A deployed app must set its own. */
export function cronSecretAccepted(secret: string | undefined, preview: boolean): boolean {
  if (!secret) return false;
  if (!preview && secret === "vaulty-dev-cron") return false;
  if (secret.length < 12) return false;
  return true;
}

export async function mapInBatches<T, R>(
  items: readonly T[],
  worker: (item: T) => Promise<R>,
  size = FIRE_BATCH_SIZE,
): Promise<PromiseSettledResult<R>[]> {
  const batch = Math.max(1, Math.floor(size) || FIRE_BATCH_SIZE);
  const out: PromiseSettledResult<R>[] = [];
  for (let i = 0; i < items.length; i += batch) {
    const chunk = items.slice(i, i + batch);
    const settled = await Promise.allSettled(chunk.map((item) => worker(item)));
    out.push(...settled);
  }
  return out;
}
