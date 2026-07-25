import { describe, expect, it } from "vitest";
import { beltForLevel } from "./belt";

// Passport tier (code name Belt): flavor label derived from level.
describe("beltForLevel", () => {
  it("maps the documented level boundaries to their passport tiers", () => {
    expect(beltForLevel(1)).toBe("ワンデーパス");
    expect(beltForLevel(2)).toBe("ワンデーパス");
    expect(beltForLevel(3)).toBe("ウィークパス");
    expect(beltForLevel(9)).toBe("年間パス");
    expect(beltForLevel(11)).toBe("プレミア年パス");
    expect(beltForLevel(14)).toBe("プレミア年パス");
    expect(beltForLevel(15)).toBe("レジェンドパス");
    expect(beltForLevel(99)).toBe("レジェンドパス");
  });
});
