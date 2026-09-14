import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { lsGet, lsRemove, lsSet, tooLarge } from "./storage.ts";

describe("storage quota", () => {
  it("returns false instead of throwing when setItem fails", () => {
    const mem = new Map<string, string>();
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        localStorage: {
          getItem: (k: string) => mem.get(k) ?? null,
          setItem: (k: string, v: string) => {
            if (v.length > 8) throw new Error("QuotaExceededError");
            mem.set(k, v);
          },
          removeItem: (k: string) => {
            mem.delete(k);
          },
        },
      },
    });
    assert.equal(lsSet("ok", "short"), true);
    assert.equal(lsGet("ok"), "short");
    assert.equal(lsSet("big", "0123456789"), false);
    lsRemove("ok");
    assert.equal(lsGet("ok"), null);
    assert.equal(tooLarge("x".repeat(1_500_001)), true);
  });
});
