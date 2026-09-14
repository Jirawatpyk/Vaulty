import { ASSET_CATEGORIES, DOCUMENT_KINDS, MARITAL_KINDS, RELATIONSHIPS, type Asset, type Beneficiary, type DocumentItem, type Letter, type VaultData } from "./types.ts";
import { coerceWillCustody } from "./will-custody.ts";

export function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

export function coerceVault(data: unknown): VaultData | null {
  if (!data || typeof data !== "object") return null;
  const v = data as Record<string, unknown>;
  const profile = v.profile && typeof v.profile === "object" ? (v.profile as Record<string, unknown>) : {};
  const wishes = v.wishes && typeof v.wishes === "object" ? (v.wishes as Record<string, unknown>) : {};
  const access = v.access && typeof v.access === "object" ? (v.access as Record<string, unknown>) : {};
  const fullName = asString(profile.fullName).trim();
  if (!fullName) return null;

  return {
    profile: {
      fullName,
      dateOfBirth: asString(profile.dateOfBirth),
      city: asString(profile.city),
      occupation: asString(profile.occupation),
    },
    assets: Array.isArray(v.assets) ? v.assets.map(coerceAsset).filter((x): x is Asset => Boolean(x)) : [],
    beneficiaries: Array.isArray(v.beneficiaries)
      ? v.beneficiaries.map(coerceHeir).filter((x): x is Beneficiary => Boolean(x))
      : [],
    letters: Array.isArray(v.letters) ? v.letters.map(coerceLetter).filter((x): x is Letter => Boolean(x)) : [],
    documents: Array.isArray(v.documents)
      ? v.documents.map(coerceDoc).filter((x): x is DocumentItem => Boolean(x))
      : [],
    wishes: {
      funeral: asString(wishes.funeral),
      restingPlace: asString(wishes.restingPlace),
      organDonation: Boolean(wishes.organDonation),
      digitalAfterlife: asString(wishes.digitalAfterlife),
      other: asString(wishes.other),
    },
    access: {
      executorName: asString(access.executorName),
      executorRole: asString(access.executorRole),
      executorContact: asString(access.executorContact),
      emergencyName: asString(access.emergencyName),
      emergencyContact: asString(access.emergencyContact),
      checkInDays: clamp(Number(access.checkInDays) || 30, 1, 365),
      lastCheckIn: asString(access.lastCheckIn) || new Date().toISOString(),
      releaseNote: asString(access.releaseNote),
    },
    willCustody: coerceWillCustody(v.willCustody),
    activity: Array.isArray(v.activity)
      ? v.activity
          .filter((item) => item && typeof item === "object")
          .map((item) => {
            const a = item as Record<string, unknown>;
            return {
              id: asString(a.id) || "act",
              at: asString(a.at) || new Date().toISOString(),
              text: asString(a.text),
            };
          })
          .slice(0, 40)
      : [],
    createdAt: asString(v.createdAt) || new Date().toISOString(),
  };
}

function coerceAsset(x: unknown): Asset | null {
  if (!x || typeof x !== "object") return null;
  const a = x as Record<string, unknown>;
  const name = asString(a.name).trim();
  const id = asString(a.id);
  if (!name || !id) return null;
  const category = ASSET_CATEGORIES.includes(a.category as Asset["category"]) ? (a.category as Asset["category"]) : "other";
  return {
    id,
    category,
    name,
    institution: asString(a.institution),
    identifier: asString(a.identifier),
    valueThb: clamp(Number(a.valueThb) || 0, 0, 1_000_000_000_000),
    location: asString(a.location),
    notes: asString(a.notes),
    beneficiaryIds: Array.isArray(a.beneficiaryIds) ? a.beneficiaryIds.map((id) => String(id)) : [],
    secret: asString(a.secret),
    marital: MARITAL_KINDS.includes(a.marital as Asset["marital"]) ? (a.marital as Asset["marital"]) : "unknown",
    updatedAt: asString(a.updatedAt) || new Date().toISOString(),
  };
}

function coerceHeir(x: unknown): Beneficiary | null {
  if (!x || typeof x !== "object") return null;
  const b = x as Record<string, unknown>;
  const name = asString(b.name).trim();
  const id = asString(b.id);
  if (!name || !id) return null;
  const relationship = RELATIONSHIPS.includes(b.relationship as Beneficiary["relationship"])
    ? (b.relationship as Beneficiary["relationship"])
    : "other";
  return {
    id,
    name,
    relationship,
    sharePercent: clamp(Number(b.sharePercent) || 0, 0, 100),
    email: asString(b.email),
    phone: asString(b.phone),
    notes: asString(b.notes),
  };
}

function coerceLetter(x: unknown): Letter | null {
  if (!x || typeof x !== "object") return null;
  const l = x as Record<string, unknown>;
  const id = asString(l.id);
  const body = asString(l.body);
  if (!id || !body.trim()) return null;
  return {
    id,
    toBeneficiaryId: asString(l.toBeneficiaryId),
    title: asString(l.title) || "Letter",
    body,
    updatedAt: asString(l.updatedAt) || new Date().toISOString(),
  };
}

function coerceDoc(x: unknown): DocumentItem | null {
  if (!x || typeof x !== "object") return null;
  const d = x as Record<string, unknown>;
  const id = asString(d.id);
  const title = asString(d.title).trim();
  if (!id || !title) return null;
  const kind = DOCUMENT_KINDS.includes(d.kind as DocumentItem["kind"]) ? (d.kind as DocumentItem["kind"]) : "other";
  return {
    id,
    title,
    kind,
    notes: asString(d.notes),
    secret: asString(d.secret),
    fileName: asString(d.fileName) || undefined,
    fileMime: asString(d.fileMime) || undefined,
    fileData: asString(d.fileData).length > 500_000 ? undefined : asString(d.fileData) || undefined,
  };
}
