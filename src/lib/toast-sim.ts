import { TOAST_CONFIG } from "./toast-config";

export type Kind = "jam" | "ham";

export type ToastSupply = { remaining: number; revives: number };
export function createSupply(): ToastSupply {
  return { remaining: TOAST_CONFIG.stock.initial, revives: 0 };
}
export function spendToast(supply: ToastSupply) {
  if (supply.remaining <= 0) return false;
  supply.remaining--;
  return true;
}
export function rewardSupplyHit(supply: ToastSupply, target: "student" | "chef" | "truck") {
  const amount = target === "student" ? TOAST_CONFIG.stock.studentHit : target === "chef" ? TOAST_CONFIG.bonuses.chef : 0;
  supply.remaining += amount;
  return amount;
}
export function reviveSupply(supply: ToastSupply) {
  if (supply.remaining > 0) return false;
  supply.remaining = TOAST_CONFIG.stock.initial;
  supply.revives++;
  return true;
}
export function finalScorePoints(correctRounds: number) {
  return Math.round(correctRounds / TOAST_CONFIG.rounds.count * 100);
}
export type RoundResult = { round: number; correct: boolean; guess: Kind | null; odds: Odds; n: number; reason: "guess" | "test" };
export function evaluateRound(round: number, guess: Kind | null, odds: Odds, n: number): RoundResult {
  return { round, guess, odds: { ...odds }, n, correct: guess !== null && odds[guess] > odds[guess === "jam" ? "ham" : "jam"], reason: guess === null ? "test" : "guess" };
}
export const REVIVE_QUESTIONS = [
  { question: "Which sample usually gives a more stable running average?", options: ["10 drops", "500 drops", "They are always equally stable"], correct: 1, explanation: "Larger samples usually give more stable averages." },
  { question: "Jam is ahead after just 10 drops. What can you conclude?", options: ["Jam definitely has higher true odds", "Ham must catch up on the next drop", "The sample may be too small to decide"], correct: 2, explanation: "A small sample can be misleading; neither topping owes you a catch-up." },
  { question: "As more drops land, the running average tends towards…", options: ["The topping’s true probability", "Exactly 50%, regardless of the odds", "100%, because Murphy says so"], correct: 0, explanation: "The Law of Large Numbers points to the true probability, not necessarily 50%." },
] as const;
export function evaluateReviveTest(answers: readonly number[]) {
  const complete = answers.length === 3 && REVIVE_QUESTIONS.every((q, i) => Number.isInteger(answers[i]) && answers[i] >= 0 && answers[i] < q.options.length);
  const correct = complete ? REVIVE_QUESTIONS.filter((q, i) => answers[i] === q.correct).length : 0;
  return { complete, correct, passed: complete && correct >= 1 };
}
export function canOpenEmptyLab(supply: ToastSupply, burstCount: number, flightCount: number) {
  return supply.remaining === 0 && burstCount === 0 && flightCount === 0;
}

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
  const [min, max] = TOAST_CONFIG.rounds.gapPoints;
  const high = Math.round((low * 100) + min + rng() * (max - min)) / 100;
  return rng() < 0.5 ? { jam: low, ham: high } : { jam: high, ham: low };
}

export function canOpenNotebook(lab: boolean, burstCount: number, flightCount: number, holding: boolean) {
  return lab && burstCount === 0 && flightCount === 0 && !holding;
}

export const MILESTONES = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000];

/** Stop normal launches at a due checkpoint, then let every existing flight/burst settle. */
export function shouldDrainForNotebook(lab: boolean, n: number, seen: ReadonlySet<number>, reportRequested = false) {
  return lab && (reportRequested || MILESTONES.some((m) => n >= m && !seen.has(m)));
}

/** Match the background's centered cover crop, keeping walkers anchored to the actual paving. */
export function courtyardPoint(x: number, y: number, width: number, height: number) {
  const image = TOAST_CONFIG.courtyard;
  const scale = Math.max(width / image.width, height / image.height);
  return {
    x: (width - image.width * scale) / 2 + x * image.width * scale,
    y: (height - image.height * scale) / 2 + y * image.height * scale,
  };
}

export function advanceWalker(walker: { x: number; vx: number; min: number; max: number }, dt: number) {
  walker.x += walker.vx * dt;
  if (walker.x < walker.min || walker.x > walker.max) {
    walker.vx *= -1;
    walker.x = Math.min(walker.max, Math.max(walker.min, walker.x));
  }
}

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

export type JournalEntry = { n: number; which: string; gap: string; jam: number; ham: number };
export type EntryVerdict = { n: number; whichOk: boolean; gapOk: boolean | null; note: string };

/** Score lab-notebook answers against the true odds and the actual gap trend. */
export function evaluateJournal(journal: readonly JournalEntry[], odds: Odds) {
  const truth = odds.jam > odds.ham ? "Jam" : "Ham";
  const verdicts: EntryVerdict[] = journal.map((j, i) => {
    const whichOk = j.which === truth || (j.which === "Can't tell yet" && j.n < 50);
    const prev = journal[i - 1];
    let gapOk: boolean | null = null;
    if (prev) {
      const d = Math.abs(j.ham - j.jam) - Math.abs(prev.ham - prev.jam);
      const actual = d > 0.02 ? "Widening" : d < -0.02 ? "Narrowing" : "Holding steady";
      gapOk = j.gap === actual;
    }
    const note = j.which === "Can't tell yet" && j.n < 50 ? "Wise caution with so few drops."
      : whichOk ? `Right call: ${truth} really is more likely.` : j.which === "Can't tell yet" ? "By now there was enough data to commit." : `The data fooled you here — ${truth} is truly more likely.`;
    return { n: j.n, whichOk, gapOk, note };
  });
  const checks = verdicts.flatMap((v) => (v.gapOk == null ? [v.whichOk] : [v.whichOk, v.gapOk]));
  const score = checks.length ? checks.filter(Boolean).length / checks.length : 0;
  return { truth, verdicts, score, finalOk: verdicts.at(-1)?.whichOk ?? false };
}
