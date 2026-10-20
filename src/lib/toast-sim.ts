export type Kind = "jam" | "ham";

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
