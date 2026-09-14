import { create } from "zustand";
import { isEncryptedBlob, openVault, resealVault, sealVaultWithKey, type EncryptedBlob } from "./crypto";
import { DEMO_PIN, type Lang, type VaultData, type VaultStatus } from "./types";
import { coerceVault } from "./coerce";
import { uid } from "./format";
import { t, type I18nKey } from "./i18n";
import { clearSecurity, pushSec, readLockout, recordFail, remainingMs, resetLockout, type SecKind } from "./lockout";
import { backupDue as isBackupDue, clearBackupMeta, markBackupNeeded, markCardSaved as writeCardSaved, markExported, recoveryReady as isRecoveryReady } from "./backup";
import { classifySealed, canRestore, recoverAutoLock, shouldCommitPersist } from "./recover";
import { createDemoVault, emptyVault } from "./seed";
import { isValidUnlockSecret } from "./secret";
import { claimThisTab } from "./tabs";
import { lsGet, lsRemove, lsSet, tooLarge } from "./storage";

const VAULT_KEY = "vaulty.v1";
const LANG_KEY = "vaulty.lang";
const DEMO_KEY = "vaulty.demo";
const AUTOLOCK_KEY = "vaulty.autolock";

let sessionKey: CryptoKey | null = null;
let sessionSalt: string | null = null;
let persistTimer: ReturnType<typeof setTimeout> | null = null;
let persistGen = 0;
let unlockSeq = 0;

function readLang(): Lang {
  const v = lsGet(LANG_KEY);
  return v === "en" ? "en" : "th";
}

function readBlob(): EncryptedBlob | null {
  const raw = lsGet(VAULT_KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (isEncryptedBlob(parsed)) return parsed;
  } catch {
    return null;
  }
  return null;
}

function writeBlob(blob: EncryptedBlob) {
  const raw = JSON.stringify(blob);
  if (tooLarge(raw) || !lsSet(VAULT_KEY, raw)) {
    throw new Error("quota");
  }
}

type State = {
  status: VaultStatus;
  lang: Lang;
  vault: VaultData | null;
  isDemo: boolean;
  autoLockMinutes: number;
  busy: boolean;
  error: string | null;
  lockoutUntil: number;
  failedAttempts: number;
  announce: string;
  backupDue: boolean;
  peerView: boolean;
  recoveryReady: boolean;
  hydrate: () => void;
  setLang: (lang: Lang) => void;
  unlock: (pin: string) => Promise<boolean>;
  lock: (kind?: SecKind) => void;
  create: (name: string, pin: string) => Promise<void>;
  openDemo: () => Promise<void>;
  wipe: () => void;
  patch: (fn: (vault: VaultData) => VaultData, activity?: string) => void;
  checkIn: () => void;
  changePin: (nextPin: string) => Promise<void>;
  setAutoLockMinutes: (n: number) => void;
  exportBlob: () => Promise<string | null>;
  importBlob: (raw: string) => boolean;
  flush: () => Promise<void>;
  yieldToPeer: () => void;
  takeover: () => void;
  markCardSaved: () => void;
};

async function persist(vault: VaultData, gen: number): Promise<boolean> {
  if (!shouldCommitPersist(gen, persistGen, Boolean(sessionKey && sessionSalt))) return false;
  try {
    const blob = await resealVault(vault, sessionKey!, sessionSalt!);
    if (!shouldCommitPersist(gen, persistGen, Boolean(sessionKey))) return false;
    writeBlob(blob);
    if (useVaultStore.getState().error === "persist") {
      useVaultStore.setState({ error: null });
    }
    return true;
  } catch {
    if (!shouldCommitPersist(gen, persistGen, true)) return false;
    useVaultStore.setState({ error: "persist" });
    return false;
  }
}

function schedulePersist(vault: VaultData) {
  persistGen += 1;
  const gen = persistGen;
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistTimer = null;
    void persist(vault, gen);
  }, 120);
}

async function flushPersist() {
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  const vault = useVaultStore.getState().vault;
  if (vault && sessionKey && sessionSalt) {
    await persist(vault, persistGen);
  }
}

function dropSession() {
  persistGen += 1;
  unlockSeq += 1;
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  sessionKey = null;
  sessionSalt = null;
}

function withActivity(vault: VaultData, text?: string): VaultData {
  if (!text) return vault;
  return {
    ...vault,
    activity: [{ id: uid(), at: new Date().toISOString(), text }, ...vault.activity].slice(0, 40),
  };
}

export const useVaultStore = create<State>((set, get) => ({
  status: "empty",
  lang: "th",
  vault: null,
  isDemo: false,
  autoLockMinutes: 5,
  busy: false,
  error: null,
  lockoutUntil: 0,
  failedAttempts: 0,
  announce: "",
  backupDue: false,
  peerView: false,
  recoveryReady: false,

  hydrate: () => {
    if (get().status === "unlocked" && sessionKey) return;
    const lang = readLang();
    const auto = recoverAutoLock(lsGet(AUTOLOCK_KEY));
    const lo = readLockout();
    const health = classifySealed(lsGet(VAULT_KEY));
    set({
      lang,
      status: health === "empty" ? "empty" : "locked",
      isDemo: lsGet(DEMO_KEY) === "1",
      autoLockMinutes: auto,
      vault: null,
      lockoutUntil: lo.until,
      failedAttempts: lo.fails,
      error: health === "corrupt" ? "corrupt" : null,
      backupDue: isBackupDue(),
      recoveryReady: isRecoveryReady(),
    });
  },

  setLang: (lang) => {
    lsSet(LANG_KEY, lang);
    if (typeof document !== "undefined") document.documentElement.lang = lang;
    set({ lang });
  },

  unlock: async (pin) => {
    if (get().busy) return false;
    if (!isValidUnlockSecret(pin)) {
      set({ error: "pin" });
      return false;
    }
    const blob = readBlob();
    if (!blob) {
      set({ error: "empty" });
      return false;
    }
    const lo = readLockout();
    if (remainingMs(lo) > 0) {
      set({ error: "lockout", lockoutUntil: lo.until, failedAttempts: lo.fails, busy: false });
      return false;
    }
    const seq = ++unlockSeq;
    set({ busy: true, error: null });
    try {
      const { data, key } = await openVault<VaultData>(blob, pin);
      if (seq !== unlockSeq) return false;
      const vault = coerceVault(data);
      if (!vault) {
        set({ busy: false, error: "corrupt" });
        return false;
      }
      sessionKey = key;
      sessionSalt = blob.salt;
      resetLockout();
      pushSec("unlock");
      const lang = get().lang;
      set({
        status: "unlocked",
        vault,
        busy: false,
        error: null,
        lockoutUntil: 0,
        failedAttempts: 0,
        backupDue: isBackupDue(),
        peerView: false,
        recoveryReady: isRecoveryReady(),
        announce: t(lang, "a11yUnlocked"),
      });
      get().patch((v) => v, lang === "th" ? "เปิดคลัง" : "Vault unlocked");
      return true;
    } catch {
      if (seq !== unlockSeq) return false;
      const next = recordFail();
      const locked = remainingMs(next) > 0;
      set({
        busy: false,
        error: locked ? "lockout" : "pin",
        lockoutUntil: next.until,
        failedAttempts: next.fails,
      });
      return false;
    }
  },

  lock: (kind = "lock") => {
    const vault = get().vault;
    const key = sessionKey;
    const salt = sessionSalt;
    dropSession();
    if (vault && key && salt) {
      void resealVault(vault, key, salt).then(writeBlob).catch(() => undefined);
    }
    pushSec(kind);
    set({
      status: "locked",
      vault: null,
      error: null,
      busy: false,
      peerView: false,
      announce: t(get().lang, "a11yLocked"),
    });
  },

  create: async (name, pin) => {
    if (get().busy) return;
    if (!name.trim() || !isValidUnlockSecret(pin)) return;
    set({ busy: true, error: null });
    try {
      const vault = emptyVault(name.trim(), get().lang);
      const { blob, key } = await sealVaultWithKey(vault, pin);
      writeBlob(blob);
      lsSet(DEMO_KEY, "0");
      sessionKey = key;
      sessionSalt = blob.salt;
      resetLockout();
      pushSec("unlock");
      set({
        status: "unlocked",
        vault,
        isDemo: false,
        busy: false,
        backupDue: true,
        peerView: false,
        recoveryReady: false,
        announce: t(get().lang, "a11yUnlocked"),
      });
    } catch {
      set({ busy: false, error: "persist" });
    }
  },

  openDemo: async () => {
    const seq = ++unlockSeq;
    set({ busy: true, error: null });
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
    if (seq !== unlockSeq) return;
    try {
      const lang = get().lang;
      const vault = createDemoVault(lang);
      const { blob, key } = await sealVaultWithKey(vault, DEMO_PIN);
      if (seq !== unlockSeq) return;
      sessionKey = key;
      sessionSalt = blob.salt;
      resetLockout();
      pushSec("unlock");
      writeBlob(blob);
      lsSet(DEMO_KEY, "1");
      set({
        status: "unlocked",
        vault,
        isDemo: true,
        busy: false,
        backupDue: true,
        peerView: false,
        recoveryReady: true,
        announce: t(lang, "a11yUnlocked"),
      });
    } catch {
      if (seq !== unlockSeq) return;
      set({ busy: false, error: "persist" });
    }
  },

  wipe: () => {
    dropSession();
    lsRemove(VAULT_KEY);
    lsRemove(DEMO_KEY);
    clearSecurity();
    clearBackupMeta();
    set({ status: "empty", vault: null, isDemo: false, error: null, lockoutUntil: 0, failedAttempts: 0, busy: false, backupDue: false, peerView: false, recoveryReady: false });
  },

  patch: (fn, activity) => {
    const current = get().vault;
    if (!current || get().status !== "unlocked" || get().peerView) return;
    const next = withActivity(fn(current), activity);
    set({ vault: next });
    schedulePersist(next);
  },

  checkIn: () => {
    const { lang } = get();
    pushSec("checkin");
    get().patch(
      (v) => ({
        ...v,
        access: { ...v.access, lastCheckIn: new Date().toISOString() },
      }),
      lang === "th" ? "เช็คอินตามแผนส่งมอบ" : "Checked in on the release plan",
    );
    const days = get().vault?.access.checkInDays;
    void import("./deadman-fn")
      .then(({ pingDeadman }) => pingDeadman({ data: { intervalDays: days } }))
      .catch(() => undefined);
  },

  changePin: async (nextPin) => {
    const vault = get().vault;
    if (!vault || get().busy || get().peerView || !isValidUnlockSecret(nextPin)) return;
    await flushPersist();
    persistGen += 1;
    const { blob, key } = await sealVaultWithKey(vault, nextPin);
    writeBlob(blob);
    sessionKey = key;
    sessionSalt = blob.salt;
    pushSec("pin");
    markBackupNeeded();
    set({ backupDue: true });
    get().patch((v) => v, get().lang === "th" ? "เปลี่ยนรหัสผ่าน" : "Passcode changed");
  },

  setAutoLockMinutes: (n) => {
    const v = Math.min(30, Math.max(1, Math.round(n)));
    lsSet(AUTOLOCK_KEY, String(v));
    set({ autoLockMinutes: v });
  },

  flush: () => flushPersist(),

  exportBlob: async () => {
    await flushPersist();
    pushSec("export");
    const raw = lsGet(VAULT_KEY);
    const payload =
      raw ??
      (await (async () => {
        const vault = get().vault;
        if (vault && sessionKey && sessionSalt) {
          try {
            return JSON.stringify(await resealVault(vault, sessionKey, sessionSalt));
          } catch {
            return null;
          }
        }
        return null;
      })());
    if (payload) {
      markExported();
      set({ backupDue: false, recoveryReady: isRecoveryReady() });
    }
    return payload;
  },

  importBlob: (raw) => {
    if (typeof raw !== "string" || tooLarge(raw) || !canRestore(raw)) return false;
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!isEncryptedBlob(parsed)) return false;
      dropSession();
      writeBlob(parsed);
      lsSet(DEMO_KEY, "0");
      resetLockout();
      pushSec("import");
      set({
        status: "locked",
        vault: null,
        isDemo: false,
        error: null,
        lockoutUntil: 0,
        failedAttempts: 0,
        busy: false,
      });
      return true;
    } catch {
      return false;
    }
  },

  yieldToPeer: () => {
    if (get().status !== "unlocked" || get().peerView) return;
    set({
      peerView: true,
      announce: t(get().lang, "peerReadonly"),
    });
  },

  takeover: () => {
    if (get().status !== "unlocked") return;
    set({ peerView: false });
    claimThisTab();
  },

  markCardSaved: () => {
    writeCardSaved();
    set({ recoveryReady: isRecoveryReady() });
  },
}));

export function useT(): (key: I18nKey) => string {
  const lang = useVaultStore((s) => s.lang);
  return (key) => t(lang, key);
}
