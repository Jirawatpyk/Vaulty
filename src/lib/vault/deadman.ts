export const FIRE_COOLDOWN_MS = 20 * 60 * 60 * 1000;

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

export function switchMessage(ownerLabel: string, lang: SwitchLang): string {
  const name = ownerLabel.trim() || "Vaulty";
  if (lang === "th") {
    return `Vaulty: คลังของ ${name} เลยกำหนดเช็คอินแล้ว โปรดเปิดแอปบนเครื่องที่เก็บคลัง หรือติดต่อผู้จัดการมรดก — อย่าใส่รหัสในข้อความนี้`;
  }
  return `Vaulty: ${name}’s vault missed a check-in. Open the app on the device that holds the vault, or contact the executor. Do not put the passcode in this message.`;
}

export function switchSubject(ownerLabel: string, lang: SwitchLang): string {
  const name = ownerLabel.trim() || "vault";
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

export function sanitizeInterval(days: unknown): number {
  const n = Math.round(Number(days));
  if (!Number.isFinite(n)) return 30;
  return Math.min(365, Math.max(1, n));
}
