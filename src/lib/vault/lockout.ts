import { parseLockout, parseSecEvents } from "./recover.ts";
import { lsGet, lsRemove, lsSet } from "./storage.ts";

export type LockoutState = {
  fails: number;
  until: number;
};

export type SecKind =
  | "unlock"
  | "lock"
  | "fail"
  | "export"
  | "import"
  | "wipe"
  | "pin"
  | "hide"
  | "checkin"
  | "idle";

export type SecEvent = { at: string; kind: SecKind };

export const LOCKOUT_KEY = "vaulty.lockout";
export const SEC_KEY = "vaulty.sec";

export function backoffMs(fails: number): number {
  if (fails < 5) return 0;
  if (fails < 8) return 30_000;
  if (fails < 10) return 120_000;
  return 15 * 60_000;
}

export function remainingMs(state: LockoutState, now = Date.now()): number {
  return Math.max(0, (state.until || 0) - now);
}

export function nextLockout(prev: LockoutState, now = Date.now()): LockoutState {
  const fails = prev.fails + 1;
  const wait = backoffMs(fails);
  return { fails, until: wait ? now + wait : 0 };
}

export function readLockout(): LockoutState {
  return parseLockout(lsGet(LOCKOUT_KEY));
}

export function writeLockout(state: LockoutState) {
  lsSet(LOCKOUT_KEY, JSON.stringify(state));
}

export function recordFail(now = Date.now()): LockoutState {
  const next = nextLockout(readLockout(), now);
  writeLockout(next);
  pushSec("fail");
  return next;
}

export function resetLockout() {
  writeLockout({ fails: 0, until: 0 });
}

export function readSec(): SecEvent[] {
  return parseSecEvents(lsGet(SEC_KEY));
}

export function pushSec(kind: SecKind) {
  const events = [{ at: new Date().toISOString(), kind }, ...readSec()].slice(0, 50);
  lsSet(SEC_KEY, JSON.stringify(events));
}

export function clearSecurity() {
  lsRemove(LOCKOUT_KEY);
  lsRemove(SEC_KEY);
}
