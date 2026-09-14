import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isValidUnlockSecret, secretKind } from "./secret.ts";

describe("unlock secret", () => {
  it("accepts a 6–12 digit pin or a passphrase", () => {
    assert.equal(isValidUnlockSecret("258036"), true);
    assert.equal(isValidUnlockSecret("12345678"), true);
    assert.equal(isValidUnlockSecret("family-garden-1968"), true);
    assert.equal(isValidUnlockSecret("12345"), false);
    assert.equal(isValidUnlockSecret("short"), false);
    assert.equal(secretKind("258036"), "pin");
    assert.equal(secretKind("family-garden-1968"), "phrase");
  });
});
