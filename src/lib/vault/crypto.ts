const encoder = new TextEncoder();
const decoder = new TextDecoder();

export type EncryptedBlob = {
  v: 1;
  salt: string;
  iv: string;
  data: string;
};

function bufToB64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  const chunk = 8192;
  const parts: string[] = [];
  for (let i = 0; i < bytes.length; i += chunk) {
    const end = Math.min(i + chunk, bytes.length);
    let s = "";
    for (let j = i; j < end; j++) s += String.fromCharCode(bytes[j]!);
    parts.push(s);
  }
  return btoa(parts.join(""));
}

function b64ToBytes(b64: string): Uint8Array {
  try {
    const raw = atob(b64);
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
    return bytes;
  } catch {
    throw new Error("invalid encoding");
  }
}

export function randomSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16));
}

export async function deriveKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    "raw",
    encoder.encode(pin),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: 100_000,
      hash: "SHA-256",
    },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptJson(data: unknown, key: CryptoKey): Promise<{ iv: string; data: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(JSON.stringify(data)),
  );
  return { iv: bufToB64(iv), data: bufToB64(cipher) };
}

export async function decryptJson<T>(blob: { iv: string; data: string }, key: CryptoKey): Promise<T> {
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: b64ToBytes(blob.iv) as BufferSource },
    key,
    b64ToBytes(blob.data) as BufferSource,
  );
  return JSON.parse(decoder.decode(plain)) as T;
}

export async function sealVaultWithKey(
  data: unknown,
  pin: string,
): Promise<{ blob: EncryptedBlob; key: CryptoKey }> {
  const salt = randomSalt();
  const key = await deriveKey(pin, salt);
  const { iv, data: cipher } = await encryptJson(data, key);
  return { blob: { v: 1, salt: bufToB64(salt), iv, data: cipher }, key };
}

export async function sealVault(data: unknown, pin: string): Promise<EncryptedBlob> {
  return (await sealVaultWithKey(data, pin)).blob;
}

export async function openVault<T>(blob: EncryptedBlob, pin: string): Promise<{ data: T; key: CryptoKey }> {
  const salt = b64ToBytes(blob.salt);
  const key = await deriveKey(pin, salt);
  const data = await decryptJson<T>(blob, key);
  return { data, key };
}

export async function resealVault(data: unknown, key: CryptoKey, saltB64: string): Promise<EncryptedBlob> {
  const { iv, data: cipher } = await encryptJson(data, key);
  return { v: 1, salt: saltB64, iv, data: cipher };
}

export function isEncryptedBlob(value: unknown): value is EncryptedBlob {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  return (
    o.v === 1 &&
    typeof o.salt === "string" &&
    o.salt.length > 0 &&
    typeof o.iv === "string" &&
    o.iv.length > 0 &&
    typeof o.data === "string" &&
    o.data.length > 0
  );
}
