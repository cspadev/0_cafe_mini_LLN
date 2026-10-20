import { describe, expect, it } from "vitest";
import { createOdds, canOpenNotebook, createStats, record, rollDown, rate } from "@/lib/toast-sim";

describe("toast probabilities", () => {
  it("generates different secret odds for new experiments", () => {
    expect(createOdds(() => 0)).toEqual({ jam: 0.35, ham: 0.43 });
    expect(createOdds(() => 0.9)).toEqual({ jam: 0.87, ham: 0.67 });
  });
  it("either topping can have the higher probability", () => {
    expect(createOdds(() => 0).ham).toBeGreaterThan(createOdds(() => 0).jam);
    expect(createOdds(() => 0.9).jam).toBeGreaterThan(createOdds(() => 0.9).ham);
  });
  it("roll uses the kind's probability", () => {
    const odds = { jam: 0.53, ham: 0.68 };
    expect(rollDown("ham", odds, () => 0.6)).toBe(true);
    expect(rollDown("jam", odds, () => 0.6)).toBe(false);
  });
  it("running average tracks downs over n", () => {
    const s = createStats();
    record(s, "jam", true);
    record(s, "jam", false);
    record(s, "jam", true);
    record(s, "jam", true);
    expect(rate(s.jam)).toBe(0.75);
  });
  it("never opens the notebook during a bulk drop or falling toast", () => {
    expect(canOpenNotebook(true, 1, 0, false)).toBe(false);
    expect(canOpenNotebook(true, 0, 300, false)).toBe(false);
    expect(canOpenNotebook(true, 0, 0, true)).toBe(false);
    expect(canOpenNotebook(true, 0, 0, false)).toBe(true);
  });
  it("reports appear only in lab sessions", () => {
    expect(canOpenNotebook(false, 0, 0, false)).toBe(false);
  });
});
