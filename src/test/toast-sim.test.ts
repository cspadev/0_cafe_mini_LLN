import { describe, expect, it } from "vitest";
import { createOdds, canOpenNotebook, shouldDrainForNotebook, courtyardPoint, advanceWalker, createStats, createTruckVisit, advanceTruck, rewardTruckHit, record, rollDown, rate } from "@/lib/toast-sim";
import { TOAST_CONFIG } from "@/lib/toast-config";

describe("toast probabilities", () => {
  it("generates different secret odds for new experiments", () => {
    expect(createOdds(() => 0)).toEqual({ jam: 0.35, ham: 0.43 });
    expect(createOdds(() => 0.9)).toEqual({ jam: 0.88, ham: 0.67 });
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
  it.each([10, 25, 50, 100])("stops normal throwing at checkpoint %i and waits for existing drops", (n) => {
    const seen = new Set([10, 25, 50, 100].filter((m) => m < n));
    expect(shouldDrainForNotebook(true, n - 1, seen)).toBe(false);
    expect(shouldDrainForNotebook(true, n, seen)).toBe(true);
    expect(canOpenNotebook(true, 1, 20, false)).toBe(false);
    expect(canOpenNotebook(true, 0, 1, false)).toBe(false);
    expect(canOpenNotebook(true, 0, 0, false)).toBe(true);
    seen.add(n);
    expect(shouldDrainForNotebook(true, n, seen)).toBe(false);
  });
  it("does not stop Play mode at lab checkpoints", () => {
    expect(shouldDrainForNotebook(false, 100, new Set())).toBe(false);
  });
});

describe("paved student paths", () => {
  it("keeps every walker inside its paved lane even when running after a hit", () => {
    for (const student of TOAST_CONFIG.students) {
      const lane = TOAST_CONFIG.walkingPaths[student.path];
      const walker = { x: student.x as number, vx: student.speed as number, ...lane };
      for (let i = 0; i < 3000; i++) {
        advanceWalker(walker, 0.125);
        expect(walker.x).toBeGreaterThanOrEqual(lane.min);
        expect(walker.x).toBeLessThanOrEqual(lane.max);
        expect(walker.y).toBe(lane.y);
      }
    }
  });
  it("anchors paving coordinates to the centered image crop", () => {
    expect(courtyardPoint(0.5, 0.5, 1280, 1800)).toEqual({ x: 640, y: 900 });
    expect(courtyardPoint(0.75, 0.5, 390, 726)).toEqual({ x: 467.25, y: 363 });
  });
});

describe("truck visits", () => {
  it("awards 50 bonus toasts for a truck hit", () => {
    const truck = createTruckVisit(() => 0);
    truck.phase = "parked";
    expect(rewardTruckHit(truck)).toBe(50);
    expect(rewardTruckHit(truck)).toBe(0);
  });
  it("waits offscreen, enters from the right and reverses along the same path", () => {
    const truck = createTruckVisit(() => 0);
    expect(truck.phase).toBe("waiting");
    expect(truck.x).toBeGreaterThan(1);
    expect(rewardTruckHit(truck)).toBe(0);
    advanceTruck(truck, truck.remaining);
    expect(truck.phase).toBe("entering");
    const startX = truck.x;
    advanceTruck(truck, 1);
    expect(truck.x).toBeLessThan(startX);
    advanceTruck(truck, 30);
    expect(truck.phase).toBe("parked");
    expect(truck.x).toBe(TOAST_CONFIG.truck.stopX);
    advanceTruck(truck, truck.remaining);
    expect(truck.phase).toBe("leaving");
    const parkedX = truck.x;
    advanceTruck(truck, 1);
    expect(truck.x).toBeGreaterThan(parkedX);
    advanceTruck(truck, 30, () => 0);
    expect(truck.phase).toBe("waiting");
    expect(truck.remaining).toBe(45);
    expect(truck.x).toBe(startX);
  });
});

import { evaluateJournal } from "@/lib/toast-sim";
describe("final evaluation", () => {
  const odds = { jam: 0.4, ham: 0.6 };
  it("marks the more likely topping as correct and early caution as fine", () => {
    const r = evaluateJournal([
      { n: 10, which: "Can't tell yet", gap: "Widening", jam: 0.5, ham: 0.5 },
      { n: 100, which: "Jam", gap: "Widening", jam: 0.45, ham: 0.6 },
      { n: 500, which: "Ham", gap: "Holding steady", jam: 0.41, ham: 0.59 },
    ], odds);
    expect(r.truth).toBe("Ham");
    expect(r.verdicts.map((v) => v.whichOk)).toEqual([true, false, true]);
    expect(r.verdicts.map((v) => v.gapOk)).toEqual([null, true, false]);
    expect(r.score).toBe(0.6);
    expect(r.finalOk).toBe(true);
  });
  it("does not excuse 'can't tell yet' after 50 drops", () => {
    expect(evaluateJournal([{ n: 100, which: "Can't tell yet", gap: "Narrowing", jam: 0.4, ham: 0.6 }], odds).verdicts[0].whichOk).toBe(false);
  });
});
