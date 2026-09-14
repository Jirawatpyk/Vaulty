import { maritalSplit } from "./marital.ts";
import type { AssetCategory, Relationship, VaultData } from "./types.ts";

/** พ.ร.บ. ภาษีการรับมรดก พ.ศ. 2558 มาตรา 12 — เกณฑ์ยกเว้นต่อผู้รับต่อเจ้ามรดก */
export const INHERITANCE_ALLOWANCE = 100_000_000;
export const RATE_LINEAL = 0.05;
export const RATE_OTHER = 0.1;

/** ประเภทที่พระราชบัญญัติระบุเป็นทรัพย์สินที่ต้องนำมารวม (อสังหา หลักทรัพย์ เงินฝาก ยานพาหนะจดทะเบียน) */
export const TAXABLE_CATEGORIES: readonly AssetCategory[] = [
  "property",
  "banking",
  "investment",
  "vehicle",
];

export type TaxBand = "exempt" | "lineal" | "other";

export function taxBand(relationship: Relationship): TaxBand {
  if (relationship === "spouse" || relationship === "charity") return "exempt";
  if (relationship === "child" || relationship === "grandchild" || relationship === "parent") return "lineal";
  return "other";
}

export function taxRate(band: TaxBand): number {
  if (band === "exempt") return 0;
  if (band === "lineal") return RATE_LINEAL;
  return RATE_OTHER;
}

export function isTaxableCategory(category: AssetCategory): boolean {
  return (TAXABLE_CATEGORIES as readonly string[]).includes(category);
}

function estateSlice(value: number, marital: VaultData["assets"][number]["marital"], hasSpouse: boolean): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  if (!hasSpouse) return value;
  if (marital === "marital") return value / 2;
  if (marital === "separate") return value;
  return 0;
}

export type HeirTaxRow = {
  heirId: string;
  name: string;
  relationship: Relationship;
  band: TaxBand;
  rate: number;
  received: number;
  excluded: number;
  taxable: number;
  tax: number;
};

export type InheritanceTaxEstimate = {
  allowance: number;
  spouseHalf: number;
  taxableEstate: number;
  excludedEstate: number;
  unclassified: number;
  rows: HeirTaxRow[];
  totalTax: number;
  anyoneLiable: boolean;
};

export function estimateInheritanceTax(vault: VaultData): InheritanceTaxEstimate {
  const split = maritalSplit(vault);
  const hasSpouse = split.hasSpouse;
  const received = new Map<string, number>();
  const excluded = new Map<string, number>();
  for (const b of vault.beneficiaries) {
    received.set(b.id, 0);
    excluded.set(b.id, 0);
  }

  let residualTaxable = 0;
  let residualExcluded = 0;
  let taxableEstate = 0;
  let excludedEstate = 0;

  for (const asset of vault.assets) {
    const slice = estateSlice(asset.valueThb, asset.marital, hasSpouse);
    const taxable = isTaxableCategory(asset.category);
    if (taxable) taxableEstate += slice;
    else excludedEstate += slice;

    if (asset.beneficiaryIds.length === 0) {
      if (taxable) residualTaxable += slice;
      else residualExcluded += slice;
      continue;
    }
    const each = slice / asset.beneficiaryIds.length;
    for (const id of asset.beneficiaryIds) {
      if (!received.has(id)) continue;
      if (taxable) received.set(id, (received.get(id) ?? 0) + each);
      else excluded.set(id, (excluded.get(id) ?? 0) + each);
    }
  }

  const shareTotal = vault.beneficiaries.reduce((s, b) => s + b.sharePercent, 0) || 100;
  for (const b of vault.beneficiaries) {
    const portion = b.sharePercent / shareTotal;
    received.set(b.id, (received.get(b.id) ?? 0) + residualTaxable * portion);
    excluded.set(b.id, (excluded.get(b.id) ?? 0) + residualExcluded * portion);
  }

  const rows: HeirTaxRow[] = vault.beneficiaries.map((b) => {
    const band = taxBand(b.relationship);
    const rate = taxRate(band);
    const got = received.get(b.id) ?? 0;
    const leftOut = excluded.get(b.id) ?? 0;
    const taxable = band === "exempt" ? 0 : Math.max(0, got - INHERITANCE_ALLOWANCE);
    return {
      heirId: b.id,
      name: b.name,
      relationship: b.relationship,
      band,
      rate,
      received: got,
      excluded: leftOut,
      taxable,
      tax: taxable * rate,
    };
  });

  const totalTax = rows.reduce((s, r) => s + r.tax, 0);
  return {
    allowance: INHERITANCE_ALLOWANCE,
    spouseHalf: split.spouseHalf,
    taxableEstate,
    excludedEstate,
    unclassified: split.unknown,
    rows,
    totalTax,
    anyoneLiable: totalTax > 0,
  };
}
