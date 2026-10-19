export type Kind = "jam" | "ham";

/** Secret probability that each toast lands topping-side DOWN. */
export const P_DOWN: Record<Kind, number> = { jam: 0.53, ham: 0.68 };

export const MILESTONES = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000];

export type KindStats = { n: number; down: number; series: [number, number][] };
export type Stats = Record<Kind, KindStats>;

export function createStats(): Stats {
  return { jam: { n: 0, down: 0, series: [] }, ham: { n: 0, down: 0, series: [] } };
}

export function rollDown(kind: Kind, rng: () => number = Math.random): boolean {
  return rng() < P_DOWN[kind];
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
