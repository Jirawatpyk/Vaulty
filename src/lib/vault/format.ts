import type { Lang } from "./types.ts";

const thbFmt = {
  th: new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }),
  en: new Intl.NumberFormat("en-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }),
};

export function formatThb(n: number, lang: Lang): string {
  return (lang === "th" ? thbFmt.th : thbFmt.en).format(n);
}

export function formatCompactThb(n: number, lang: Lang): string {
  const abs = Math.abs(n);
  if (lang === "th") {
    if (abs >= 1_000_000) return `฿${trimNum(n / 1_000_000)} ล้าน`;
    if (abs >= 1_000) return `฿${trimNum(n / 1_000)} พัน`;
    return `฿${Math.round(n).toLocaleString("th-TH")}`;
  }
  if (abs >= 1_000_000) return `฿${trimNum(n / 1_000_000)}M`;
  if (abs >= 1_000) return `฿${trimNum(n / 1_000)}k`;
  return `฿${Math.round(n).toLocaleString("en-TH")}`;
}

function trimNum(n: number): string {
  const v = Math.round(n * 10) / 10;
  return v.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

export function formatPercent(n: number): string {
  return `${Math.round(n)}%`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "V";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase();
}

export function relativeTime(iso: string, lang: Lang): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const delta = Date.now() - then;
  const minutes = Math.floor(delta / 60_000);
  if (minutes < 2) return lang === "th" ? "เมื่อสักครู่" : "Just now";
  const days = Math.floor(delta / 86_400_000);
  if (days <= 0) return lang === "th" ? "วันนี้" : "Today";
  if (days === 1) return lang === "th" ? "เมื่อวาน" : "Yesterday";
  return lang === "th" ? `${days} วันที่แล้ว` : `${days} days ago`;
}

export function formatDate(iso: string, lang: Lang): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(lang === "th" ? "th-TH" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function addDaysIso(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export function daysUntil(iso: string): number {
  const target = new Date(iso).getTime();
  return Math.ceil((target - Date.now()) / 86_400_000);
}

export function uid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `id_${Math.random().toString(36).slice(2, 10)}`;
}
