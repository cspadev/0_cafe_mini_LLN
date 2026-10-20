import { TOAST_CONFIG } from "./toast-config";

export type Kind = "jam" | "ham";

export type TruckVisit = { phase: "waiting" | "entering" | "parked" | "leaving"; x: number; remaining: number; rewarded: boolean };
const visitDelay = (range: readonly [number, number], rng: () => number) => range[0] + rng() * (range[1] - range[0]);

export function createTruckVisit(rng: () => number = Math.random): TruckVisit {
  return { phase: "waiting", x: TOAST_CONFIG.truck.outsideX, remaining: visitDelay(TOAST_CONFIG.truck.firstVisitSeconds, rng), rewarded: false };
}

/** Drive in from offscreen, stop, reverse along the same path, then wait offscreen. */
export function advanceTruck(visit: TruckVisit, dt: number, rng: () => number = Math.random) {
  const c = TOAST_CONFIG.truck;
  if (visit.phase === "waiting" || visit.phase === "parked") {
    visit.remaining = Math.max(0, visit.remaining - dt);
    if (visit.remaining === 0) visit.phase = visit.phase === "waiting" ? "entering" : "leaving";
    return;
  }
  if (visit.phase === "entering") {
    visit.x = Math.max(c.stopX, visit.x - c.speed * dt);
    if (visit.x === c.stopX) { visit.phase = "parked"; visit.remaining = c.stopSeconds; }
  } else {
    visit.x = Math.min(c.outsideX, visit.x + c.speed * dt);
    if (visit.x === c.outsideX) {
      visit.phase = "waiting";
      visit.remaining = visitDelay(c.betweenVisitsSeconds, rng);
      visit.rewarded = false;
    }
  }
}

export function rewardTruckHit(visit: TruckVisit): number {
  if (visit.phase === "waiting" || visit.rewarded) return 0;
  visit.rewarded = true;
  return TOAST_CONFIG.bonuses.truck;
}

export type Odds = Record<Kind, number>;

/** Secret odds stay fixed within one experiment, but change on the next. */
export function createOdds(rng: () => number = Math.random): Odds {
  const low = Math.round(35 + rng() * 35) / 100;
  const high = Math.min(0.9, low + Math.round(8 + rng() * 14) / 100);
  return rng() < 0.5 ? { jam: low, ham: high } : { jam: high, ham: low };
}

export function canOpenNotebook(lab: boolean, burstCount: number, flightCount: number, holding: boolean) {
  return lab && burstCount === 0 && flightCount === 0 && !holding;
}

export const MILESTONES = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000];

export type KindStats = { n: number; down: number; series: [number, number][] };
export type Stats = Record<Kind, KindStats>;

export function createStats(): Stats {
  return { jam: { n: 0, down: 0, series: [] }, ham: { n: 0, down: 0, series: [] } };
}

export function rollDown(kind: Kind, odds: Odds, rng: () => number = Math.random): boolean {
  return rng() < odds[kind];
}

/** Records one drop; keeps every point early on, then thins the series so charts stay light. */
export function record(stats: Stats, kind: Kind, down: boolean) {
  const s = stats[kind];
  s.n += 1;
  if (down) s.down += 1;
  const step = s.n <= 100 ? 1 : Math.ceil(s.n / 100);
  if (s.n % step === 0) s.series.push([s.n, s.down / s.n]);
}

export function rate(s: KindStats) {
  return s.n ? s.down / s.n : 0;
}
