import { describe, expect, it } from "vitest";
import { createOdds, canOpenNotebook, shouldDrainForNotebook, courtyardPoint, advanceWalker, createStats, createTruckVisit, advanceTruck, rewardTruckHit, record, rollDown, rate } from "@/lib/toast-sim";
import { TOAST_CONFIG } from "@/lib/toast-config";
import { createSupply, spendToast, rewardSupplyHit, reviveSupply, finalScorePoints, canOpenEmptyLab, evaluateRound, evaluateReviveTest } from "@/lib/toast-sim";

describe("finite toast stock", () => {
  it("starts with exactly 30 toasts and cannot throw a 31st", () => {
    const supply = createSupply();
    expect(supply.remaining).toBe(30);
    for (let i = 0; i < 30; i++) expect(spendToast(supply)).toBe(true);
    expect(spendToast(supply)).toBe(false);
    expect(supply.remaining).toBe(0);
  });
  it("returns one stock toast per student hit", () => {
    const supply = createSupply();
    spendToast(supply);
    expect(rewardSupplyHit(supply, "student")).toBe(1);
    expect(supply.remaining).toBe(30);
  });
  it("adds 20 stock toasts for a chef hit", () => {
    const supply = createSupply();
    expect(rewardSupplyHit(supply, "chef")).toBe(20);
    expect(supply.remaining).toBe(50);
  });
  it("leaves truck rewards as a barrage rather than stock", () => {
    const supply = createSupply();
    expect(rewardSupplyHit(supply, "truck")).toBe(0);
    expect(supply.remaining).toBe(30);
    const truck = createTruckVisit();
    truck.phase = "parked";
    expect(rewardTruckHit(truck)).toBe(50);
  });
  it("opens an empty-stock lab only after all flights and barrages settle", () => {
    const supply = { remaining: 0, revives: 0 };
    expect(canOpenEmptyLab(supply, 1, 0)).toBe(false);
    expect(canOpenEmptyLab(supply, 0, 1)).toBe(false);
    expect(canOpenEmptyLab(supply, 0, 0)).toBe(true);
    supply.remaining = 1;
    expect(canOpenEmptyLab(supply, 0, 0)).toBe(false);
  });
  it("refills an empty bin with 30 and counts each revive", () => {
    const supply = { remaining: 0, revives: 0 };
    expect(reviveSupply(supply)).toBe(true);
    expect(supply).toEqual({ remaining: 30, revives: 1 });
    expect(reviveSupply(supply)).toBe(false);
  });
  it("awards exactly one third per correct round, with no revive penalty", () => {
    expect(finalScorePoints(0)).toBe(0);
    expect(finalScorePoints(1)).toBe(33);
    expect(finalScorePoints(2)).toBe(67);
    expect(finalScorePoints(3)).toBe(100);
  });
  it("ends the round on a final guess and awards nothing for a wrong guess", () => {
    expect(evaluateRound(1, "jam", { jam: 0.6, ham: 0.55 }, 10).correct).toBe(true);
    expect(evaluateRound(2, "ham", { jam: 0.6, ham: 0.55 }, 100).correct).toBe(false);
    expect(evaluateRound(3, null, { jam: 0.6, ham: 0.55 }, 30).reason).toBe("test");
    expect(TOAST_CONFIG.rounds.count).toBe(3);
  });
  it("requires all three lab answers and at least one correct to revive", () => {
    expect(evaluateReviveTest([0, 0, 1])).toEqual({ complete: true, correct: 0, passed: false });
    expect(evaluateReviveTest([1, 0, 1])).toEqual({ complete: true, correct: 1, passed: true });
    expect(evaluateReviveTest([1, 2, 0])).toEqual({ complete: true, correct: 3, passed: true });
    expect(evaluateReviveTest([1, -1, -1]).passed).toBe(false);
  });
});

describe("toast probabilities", () => {
  it("generates different secret odds for new experiments", () => {
    expect(createOdds(() => 0)).toEqual({ jam: 0.35, ham: 0.38 });
    expect(createOdds(() => 0.9)).toEqual({ jam: 0.75, ham: 0.67 });
  });
  it("keeps the secret difference between 3 and 8 percentage points each round", () => {
    for (let i = 0; i <= 100; i++) {
      const odds = createOdds(() => i / 100);
      const gap = Math.round(Math.abs(odds.jam - odds.ham) * 100);
      expect(gap).toBeGreaterThanOrEqual(3);
      expect(gap).toBeLessThanOrEqual(8);
    }
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
    expect(evaluateJournal([{ n: 100, which: "Can't tell yet", gap: "Narrowing", jam: 0.4, ham: 0.6 }], odds).verdicts[0]?.whichOk).toBe(false);
  });
});
