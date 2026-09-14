import { t } from "./i18n.ts";
import { WILL_CUSTODY_PLACES, type Lang, type VaultData, type WillCustody, type WillCustodyPlace } from "./types.ts";

export function emptyWillCustody(): WillCustody {
  return {
    place: "none",
    holderName: "",
    holderContact: "",
    location: "",
    depositedAt: "",
    reference: "",
    copiesWhere: "",
    notes: "",
  };
}

export function asWillCustodyPlace(value: unknown): WillCustodyPlace {
  return WILL_CUSTODY_PLACES.includes(value as WillCustodyPlace) ? (value as WillCustodyPlace) : "none";
}

export function coerceWillCustody(value: unknown): WillCustody {
  const base = emptyWillCustody();
  if (!value || typeof value !== "object") return base;
  const c = value as Record<string, unknown>;
  const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");
  return {
    place: asWillCustodyPlace(c.place),
    holderName: str(c.holderName, 120),
    holderContact: str(c.holderContact, 120),
    location: str(c.location, 200),
    depositedAt: str(c.depositedAt, 10),
    reference: str(c.reference, 80),
    copiesWhere: str(c.copiesWhere, 200),
    notes: str(c.notes, 500),
  };
}

export function vaultCustody(vault: VaultData): WillCustody {
  return vault.willCustody ?? emptyWillCustody();
}

export function isOffsiteCustody(custody: WillCustody): boolean {
  if (custody.place === "none" || custody.place === "home") return false;
  return custody.holderName.trim().length >= 2;
}

export function custodyStatus(custody: WillCustody): "offsite" | "home" | "none" {
  if (custody.place === "home") return "home";
  if (isOffsiteCustody(custody)) return "offsite";
  return "none";
}

export function custodyNeedsHolder(place: WillCustodyPlace): boolean {
  return place === "lawyer" || place === "bank" || place === "trusted" || place === "other";
}

export function custodyPlainText(custody: WillCustody, lang: Lang): string {
  const status = custodyStatus(custody);
  if (status === "none") return t(lang, "willCustodyMissing");
  const place = t(lang, custodyPlaceKey(custody.place));
  const parts = [place];
  const push = (value: string) => {
    const s = value.trim();
    if (s) parts.push(s);
  };
  push(custody.holderName);
  push(custody.location);
  push(custody.holderContact);
  push(custody.reference);
  push(custody.depositedAt);
  return parts.join(" · ");
}

export function custodyPlaceKey(place: WillCustodyPlace): "willCustodyNone" | "willCustodyHome" | "willCustodyLawyer" | "willCustodyBank" | "willCustodyTrusted" | "willCustodyOther" {
  switch (place) {
    case "home":
      return "willCustodyHome";
    case "lawyer":
      return "willCustodyLawyer";
    case "bank":
      return "willCustodyBank";
    case "trusted":
      return "willCustodyTrusted";
    case "other":
      return "willCustodyOther";
    default:
      return "willCustodyNone";
  }
}

export function custodyStatusKey(custody: WillCustody): "willCustodyOffsite" | "willCustodyAtHome" | "willCustodyMissing" {
  const status = custodyStatus(custody);
  if (status === "offsite") return "willCustodyOffsite";
  if (status === "home") return "willCustodyAtHome";
  return "willCustodyMissing";
}
