import {
  emptyConsent,
  parseConsent,
  type ConsentRecord,
} from "./legal.ts";

const KEY = "vaulty-legal-consent";

export function readLocalConsent(): ConsentRecord {
  if (typeof window === "undefined") return emptyConsent();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return emptyConsent();
    return parseConsent(JSON.parse(raw) as unknown);
  } catch {
    return emptyConsent();
  }
}

export function writeLocalConsent(record: ConsentRecord): ConsentRecord {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(record));
    } catch {
      /* quota */
    }
  }
  return record;
}
