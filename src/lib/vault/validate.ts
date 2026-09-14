import type { I18nKey } from "./i18n.ts";

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const PHONE_RE = /^\+?[0-9][0-9\s\-()]{6,18}$/;
export const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export type FieldErrors = Partial<Record<string, I18nKey | null>>;

export function hasErrors(errors: FieldErrors): boolean {
  return Object.values(errors).some((key) => Boolean(key));
}

export function requiredName(value: string, max = 80): I18nKey | null {
  const s = value.trim();
  if (!s) return "errRequired";
  if (s.length < 2) return "errNameShort";
  if (s.length > max) return "errTooLong";
  return null;
}

export function optionalText(value: string, max: number): I18nKey | null {
  if (value.length > max) return "errTooLong";
  return null;
}

export function optionalEmail(value: string): I18nKey | null {
  const s = value.trim();
  if (!s) return null;
  if (s.length > 120 || !EMAIL_RE.test(s)) return "errEmail";
  return null;
}

export function optionalPhone(value: string): I18nKey | null {
  const s = value.trim();
  if (!s) return null;
  const digits = s.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15 || !PHONE_RE.test(s)) return "errPhone";
  return null;
}

export function optionalContact(value: string): I18nKey | null {
  const s = value.trim();
  if (!s) return null;
  if (s.includes("@")) return optionalEmail(s);
  if (/\d/.test(s)) return optionalPhone(s);
  if (s.length < 4) return "errContact";
  if (s.length > 120) return "errTooLong";
  return null;
}

export function optionalDob(value: string, now = new Date()): I18nKey | null {
  const s = value.trim();
  if (!s) return null;
  if (!ISO_DATE_RE.test(s)) return "errDate";
  const [year, month, day] = s.split("-").map(Number) as [number, number, number];
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return "errDate";
  if (year < 1900) return "errDate";
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (date > today) return "errDateFuture";
  return null;
}

export function moneyValue(value: number | string): I18nKey | null {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return "errNumber";
  if (n < 0) return "errNegative";
  if (n > 1_000_000_000_000) return "errTooBig";
  return null;
}

export function sharePercent(value: number | string): I18nKey | null {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return "errNumber";
  if (n < 0 || n > 100) return "errShare";
  return null;
}

export function checkInDays(value: number | string): I18nKey | null {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || !Number.isInteger(n)) return "errNumber";
  if (n < 1 || n > 365) return "errDays";
  return null;
}

export function letterBody(value: string): I18nKey | null {
  const s = value.trim();
  if (!s) return "errRequired";
  if (s.length < 10) return "errLetterShort";
  if (value.length > 8000) return "errTooLong";
  return null;
}

export function requiredRecipient(value: string): I18nKey | null {
  return value.trim() ? null : "errRecipient";
}
