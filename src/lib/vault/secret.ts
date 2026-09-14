/** 6–12 digit PIN or a passphrase of 8–64 characters. */
export function isValidUnlockSecret(value: string): boolean {
  if (/^\d{6,12}$/.test(value)) return true;
  const s = value.trim();
  return s.length >= 8 && s.length <= 64;
}

export function secretKind(value: string): "pin" | "phrase" | null {
  if (/^\d{6}$/.test(value)) return "pin";
  if (isValidUnlockSecret(value)) return "phrase";
  return null;
}
