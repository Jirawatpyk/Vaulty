import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  BACKUP_MAX_AGE_MS,
  backupDue,
  backupReason,
  clearBackupMeta,
  lastExportAt,
  markBackupNeeded,
  markCardSaved,
  markExported,
  recoveryReady,
} from "./backup.ts";

const mem = new Map<string, string>();

Object.defineProperty(globalThis, "window", {
  value: {
    localStorage: {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => {
        mem.set(k, v);
      },
      removeItem: (k: string) => {
        mem.delete(k);
      },
    },
  },
  configurable: true,
});

describe("backup cadence", () => {
  it("is due until the first export, after a PIN change, and after 7 days", () => {
    mem.clear();
    assert.equal(backupReason(), "never");
    assert.equal(backupDue(), true);
    assert.equal(lastExportAt(), null);

    markExported(1_000);
    assert.equal(backupReason(1_000), null);
    assert.equal(lastExportAt(), 1_000);

    markBackupNeeded();
    assert.equal(backupReason(1_001), "pin");

    markExported(2_000);
    assert.equal(backupReason(2_000 + BACKUP_MAX_AGE_MS - 1), null);
    assert.equal(backupReason(2_000 + BACKUP_MAX_AGE_MS), "stale");

    clearBackupMeta();
    assert.equal(backupReason(), "never");
    assert.equal(recoveryReady(), false);
    markExported(3_000);
    assert.equal(recoveryReady(), false);
    markCardSaved(3_000);
    assert.equal(recoveryReady(), true);
  });
});
