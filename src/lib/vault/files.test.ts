import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { coerceVault } from "./coerce.ts";
import { isAllowedDocFile, MAX_DOC_FILE } from "./files.ts";
import { emptyVault } from "./seed.ts";

describe("document files", () => {
  it("rejects oversized or unknown types", () => {
    const ok = { name: "will.pdf", type: "application/pdf", size: 12_000 } as File;
    const big = { name: "will.pdf", type: "application/pdf", size: MAX_DOC_FILE + 1 } as File;
    const exe = { name: "x.exe", type: "application/x-msdownload", size: 10 } as File;
    assert.equal(isAllowedDocFile(ok), true);
    assert.equal(isAllowedDocFile(big), false);
    assert.equal(isAllowedDocFile(exe), false);
  });

  it("keeps a small attachment through coerce", () => {
    const vault = emptyVault("Ann");
    vault.documents = [
      {
        id: "d1",
        title: "Will",
        kind: "will",
        notes: "",
        secret: "",
        fileName: "will.pdf",
        fileMime: "application/pdf",
        fileData: "QQ==",
      },
    ];
    const out = coerceVault(vault);
    assert.equal(out?.documents[0]?.fileName, "will.pdf");
    assert.equal(out?.documents[0]?.fileData, "QQ==");
  });
});
