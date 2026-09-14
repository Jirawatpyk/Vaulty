import { addDaysIso } from "./format.ts";
import type { Lang, VaultData } from "./types.ts";

export function extractEmail(contact: string): string | null {
  const m = contact.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return m ? m[0] : null;
}

export function isCheckInOverdue(vault: VaultData, now = Date.now()): boolean {
  const next = new Date(addDaysIso(vault.access.lastCheckIn, vault.access.checkInDays)).getTime();
  return Number.isFinite(next) && next < now;
}

export function overdueMessage(vault: VaultData, lang: Lang): string {
  const name = vault.profile.fullName || "Vaulty";
  const executor = vault.access.executorName || (lang === "th" ? "ผู้จัดการมรดก" : "the executor");
  if (lang === "th") {
    return `Vaulty: คลังของ ${name} เลยกำหนดเช็คอินแล้ว โปรดเปิดแอปบนเครื่องที่เก็บคลัง หรือติดต่อ ${executor} — อย่าใส่รหัสในข้อความนี้`;
  }
  return `Vaulty: ${name}’s vault missed a check-in. Open the app on the device that holds the vault, or contact ${executor}. Do not put the passcode in this message.`;
}

export function overdueMailto(vault: VaultData, lang: Lang): string {
  const email = extractEmail(vault.access.executorContact) ?? extractEmail(vault.access.emergencyContact) ?? "";
  const subject =
    lang === "th" ? `Vaulty — เลยกำหนดเช็คอิน (${vault.profile.fullName || "vault"})` : `Vaulty — check-in overdue (${vault.profile.fullName || "vault"})`;
  const body = overdueMessage(vault, lang);
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function overdueLineUrl(vault: VaultData, lang: Lang): string {
  return `https://line.me/R/msg/text/?${encodeURIComponent(overdueMessage(vault, lang))}`;
}

export const NUDGE_AT_KEY = "vaulty.nudgeAt";

export function shouldBrowserNudge(overdue: boolean, lastNudge: number | null, now = Date.now()): boolean {
  if (!overdue) return false;
  if (!lastNudge) return true;
  return now - lastNudge >= 20 * 60 * 60 * 1000;
}
