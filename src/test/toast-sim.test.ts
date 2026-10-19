import { describe, expect, it } from "vitest";
import { P_DOWN, createStats, record, rollDown, rate } from "@/lib/toast-sim";

describe("toast probabilities", () => {
  it("jam lands topping-down 53% of the time", () => {
    expect(P_DOWN.jam).toBe(0.53);
  });
  it("ham lands topping-down 68% of the time", () => {
    expect(P_DOWN.ham).toBe(0.68);
  });
  it("roll uses the kind's probability", () => {
    expect(rollDown("ham", () => 0.6)).toBe(true);
    expect(rollDown("jam", () => 0.6)).toBe(false);
  });
  it("running average tracks downs over n", () => {
    const s = createStats();
    record(s, "jam", true);
    record(s, "jam", false);
    record(s, "jam", true);
    record(s, "jam", true);
    expect(rate(s.jam)).toBe(0.75);
  });
});
