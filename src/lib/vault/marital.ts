import type { Lang, MaritalKind, VaultData } from "./types.ts";

export function assetMarital(kind: MaritalKind | undefined): MaritalKind {
  return kind === "marital" || kind === "separate" ? kind : "unknown";
}

export type MaritalSplit = {
  hasSpouse: boolean;
  spouseName: string;
  gross: number;
  marital: number;
  separate: number;
  unknown: number;
  spouseHalf: number;
  estate: number;
  unclassified: number;
};

export function maritalSplit(vault: VaultData): MaritalSplit {
  const spouse = vault.beneficiaries.find((b) => b.relationship === "spouse");
  let marital = 0;
  let separate = 0;
  let unknown = 0;
  for (const a of vault.assets) {
    const v = Number.isFinite(a.valueThb) ? a.valueThb : 0;
    const kind = assetMarital(a.marital);
    if (kind === "marital") marital += v;
    else if (kind === "separate") separate += v;
    else unknown += v;
  }
  const gross = marital + separate + unknown;
  const spouseHalf = spouse ? marital / 2 : 0;
  const estate = spouse ? separate + marital / 2 : gross;
  return {
    hasSpouse: Boolean(spouse),
    spouseName: spouse?.name ?? "",
    gross,
    marital,
    separate,
    unknown,
    spouseHalf,
    estate,
    unclassified: unknown,
  };
}

export function maritalWarning(split: MaritalSplit, lang: Lang): string | null {
  if (split.unknown > 0) {
    return lang === "th"
      ? "ยังมีทรัพย์สินที่ยังไม่จำแนก — อย่าแบ่งกองมรดกจนกว่าจะแยกสินสมรสออก"
      : "Some assets are unclassified — do not divide the estate until marital property is separated.";
  }
  if (!split.hasSpouse && split.marital > 0) {
    return lang === "th"
      ? "มีสินสมรสแต่ยังไม่มีคู่สมรสในรายชื่อทายาท — ตรวจสอบสิทธิกึ่งหนึ่งก่อนแบ่ง"
      : "Marital assets are listed but no spouse heir is named — check the surviving spouse’s half first.";
  }
  if (split.hasSpouse && split.marital === 0 && split.gross > 0 && split.unknown === 0) {
    return lang === "th"
      ? "มีคู่สมรสแต่ยังไม่มีการระบุสินสมรส — ทรัพย์ที่ได้ขณะสมรสมักเป็นสินสมรส"
      : "A spouse is listed but no asset is marked marital — property acquired during marriage is often marital.";
  }
  return null;
}
