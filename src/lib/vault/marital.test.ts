import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { maritalSplit, maritalWarning } from "./marital.ts";
import { createDemoVault, emptyVault } from "./seed.ts";

describe("marital split", () => {
  it("takes the spouse half out of marital assets before the estate", () => {
    const vault = createDemoVault("th");
    const split = maritalSplit(vault);
    assert.equal(split.hasSpouse, true);
    assert.equal(split.spouseName, "วิชญ์ วรวัฒน์");
    assert.equal(split.marital, 12_500_000 + 2_430_000 + 6_800_000 + 3_120_000 + 2_800_000 + 850_000);
    assert.equal(split.spouseHalf, split.marital / 2);
    assert.equal(split.separate, 8_200_000 + 420_000);
    assert.equal(split.unknown, 2_900_000 + 1_200_000);
    assert.equal(split.estate, split.separate + split.spouseHalf);
    assert.ok(split.estate < split.gross);
    assert.match(maritalWarning(split, "th") ?? "", /ยังไม่จำแนก/);
  });

  it("does not invent a spouse half when no spouse is listed", () => {
    const vault = emptyVault("ทดลอง", "th");
    vault.assets.push({
      id: "a1",
      category: "property",
      name: "บ้าน",
      institution: "",
      identifier: "",
      valueThb: 10_000_000,
      location: "",
      notes: "",
      beneficiaryIds: [],
      secret: "",
      marital: "marital",
      updatedAt: new Date().toISOString(),
    });
    const split = maritalSplit(vault);
    assert.equal(split.hasSpouse, false);
    assert.equal(split.spouseHalf, 0);
    assert.equal(split.estate, 10_000_000);
    assert.match(maritalWarning(split, "th") ?? "", /ไม่มีคู่สมรส/);
  });
});
