import { useCallback, useEffect, useRef, useState } from "react";
import courtyardSrc from "@/assets/courtyard.jpg";
import jamSrc from "@/assets/toast-jam.png";
import hamSrc from "@/assets/toast-ham.png";
import handSrc from "@/assets/hand.png";
import chefSrc from "@/assets/chef.png";
import truckSrc from "@/assets/truck.png";
import s1Src from "@/assets/student1.png";
import s2Src from "@/assets/student2.png";
import s3Src from "@/assets/student3.png";
import s4Src from "@/assets/student4.png";
import s5Src from "@/assets/student5.png";
import s6Src from "@/assets/student6.png";
import { MILESTONES, createOdds, canOpenNotebook, shouldDrainForNotebook, courtyardPoint, advanceWalker, createStats, createTruckVisit, advanceTruck, rewardTruckHit, rate, record, rollDown, type Kind, type Stats } from "@/lib/toast-sim";
import { TOAST_CONFIG } from "@/lib/toast-config";
import { ConvergenceChart } from "./ConvergenceChart";
import { Button } from "@/components/ui/button";
import { BookOpen, RotateCcw, Volume2, VolumeX, Droplets } from "lucide-react";
import { ToastAudio } from "@/lib/toast-audio";
import { ComicStrip, INTRO_PANELS, OUTRO_PANELS } from "./ComicStory";
import { t, formatNumber, formatPercent } from "@/i18n";
import { createSupply, spendToast, rewardSupplyHit, reviveSupply, finalScorePoints, canOpenEmptyLab, evaluateRound, evaluateReviveTest, type RoundResult } from "@/lib/toast-sim";
import { RoundLab } from "./RoundLab";

type Actor = {
  kind: "student" | "chef" | "truck";
  img: string;
  x: number;
  y: number;
  vx: number;
  hitT: number;
  say: string;
  min: number;
  max: number;
};
type Flight = {
  kind: Kind;
  down: boolean;
  sx: number;
  sy: number;
  ss: number;
  tx: number;
  ty: number;
  t: number;
  dur: number;
  halfTurns: number;
  spin: number;
  bonus: boolean;
};
type Bubble = { text: string; x: number; y: number; t: number; big?: boolean };
type Burst = { left: number; every: number; acc: number; around?: { x: number; y: number }; fromSky: boolean };

const depth = (y: number) => 0.35 + 0.9 * y;
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const studentImages = { student1: s1Src, student2: s2Src, student3: s3Src, student4: s4Src, student5: s5Src, student6: s6Src };


/** Final result for the host game: share of correctly guessed rounds and per-round details. */
export type ToastSummary = {
  correctRounds: number;
  rounds: number;
  results: { round: number; correct: boolean; guess: Kind | null; reason: "guess" | "test"; n: number; odds: { jam: number; ham: number } }[];
};

/** onFinish set = running inside the host game: the final screen offers "Continue" instead of a new experiment. */
export function ToastGame({ onFinish }: { onFinish?: ((summary: ToastSummary) => void) | undefined } = {}) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgs = useRef<Record<string, HTMLImageElement>>({});
  const stats = useRef<Stats>(createStats());
  const odds = useRef(createOdds());
  const supply = useRef(createSupply());
  const [emptyLab, setEmptyLab] = useState(false);
  const audio = useRef<ToastAudio | null>(null);
  const lab = useRef(true);
  const [reportOpen, setReportOpen] = useState(false);
  const [introOpen, setIntroOpen] = useState(true);
  const [debrief, setDebrief] = useState(false);
  const reportRequested = useRef(false);
  const [soundOn, setSoundOn] = useState(true);
  const flights = useRef<Flight[]>([]);
  const bubbles = useRef<Bubble[]>([]);
  const bursts = useRef<Burst[]>([]);
  const ground = useRef<HTMLCanvasElement | null>(null);
  const aim = useRef({ x: 0.5, y: 0.55 });
  const hand = useRef<{ kind: Kind; cooldown: number }>({ kind: "jam", cooldown: 0 });
  const holding = useRef(false);
  const holdAcc = useRef(0);
  const paused = useRef(false);
  const seen = useRef(new Set<number>());
  const size = useRef({ w: 800, h: 600, dpr: 1 });
  const truckVisit = useRef(createTruckVisit());
  const actors = useRef<Actor[]>([
    { kind: "truck", img: truckSrc, x: TOAST_CONFIG.truck.outsideX, y: TOAST_CONFIG.truck.pathY, vx: -TOAST_CONFIG.truck.speed, hitT: 0, say: "", min: TOAST_CONFIG.truck.stopX, max: TOAST_CONFIG.truck.outsideX },
    { kind: "chef", img: chefSrc, x: TOAST_CONFIG.chef.x, y: TOAST_CONFIG.chef.y, vx: TOAST_CONFIG.chef.speed, hitT: 0, say: "", min: TOAST_CONFIG.chef.min, max: TOAST_CONFIG.chef.max },
    ...TOAST_CONFIG.students.map((student): Actor => ({ kind: "student", img: studentImages[student.image], x: student.x, ...TOAST_CONFIG.walkingPaths[student.path], vx: student.speed, hitT: 0, say: "" })),
  ]);

  const [, setTick] = useState(0);
  const [handKind, setHandKind] = useState<Kind>("jam");
  const [milestone, setMilestone] = useState<number | null>(null);
  const [round, setRound] = useState(1);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  const handGeom = useCallback(() => {
    const { w, h } = size.current;
    const hs = Math.min(h * 0.62, w * 0.5);
    const hx = -hs * 0.12;
    const hy = h - hs * 0.82;
    return { hs, hx, hy, tx: hx + hs * 0.79, ty: hy + hs * 0.25, ts: hs * 0.38 };
  }, []);

  const launch = useCallback(
    (bonus: boolean, opts?: { around?: { x: number; y: number }; fromSky?: boolean }) => {
      if (!bonus && !spendToast(supply.current)) { holding.current = false; return; }
      const { w, h } = size.current;
      const kind: Kind = bonus ? (Math.random() < 0.5 ? "jam" : "ham") : hand.current.kind;
      const down = rollDown(kind, odds.current);
      const g = handGeom();
      let tx: number, ty: number;
      if (opts?.around) {
        tx = opts.around.x + rnd(-0.12, 0.12);
        ty = opts.around.y + rnd(-0.1, 0.1);
      } else {
        const scatter = TOAST_CONFIG.throwing.aimScatter;
        tx = aim.current.x + rnd(-scatter, scatter);
        ty = aim.current.y + rnd(-scatter, scatter);
      }
      tx = Math.min(0.98, Math.max(0.02, tx));
      ty = Math.min(0.97, Math.max(0.25, ty));
      const sx = opts?.fromSky ? tx * w + rnd(-60, 60) : g.tx;
      const sy = opts?.fromSky ? -40 : g.ty;
      const turns = 1 + Math.floor(Math.random() * 3);
      flights.current.push({
        kind, down, sx, sy, ss: opts?.fromSky ? g.ts * 0.4 : g.ts, tx, ty, t: 0,
        dur: rnd(...TOAST_CONFIG.throwing.flightSeconds), halfTurns: turns * 2 + (down ? 1 : 0), spin: rnd(-3, 3), bonus,
      });
      if (!bonus) {
        audio.current?.play("drop");
        const next: Kind = Math.random() < 0.5 ? "jam" : "ham";
        hand.current = { kind: next, cooldown: TOAST_CONFIG.throwing.reloadSeconds };
        setHandKind(next);
      }
      void h;
    },
    [handGeom],
  );

  useEffect(() => {
    audio.current = new ToastAudio();
    return () => audio.current?.close();
  }, []);

  // load images
  useEffect(() => {
    for (const src of [jamSrc, hamSrc, handSrc, chefSrc, truckSrc, ...Object.values(studentImages)]) {
      const im = new Image();
      im.src = src;
      imgs.current[src] = im;
    }
    const k: Kind = Math.random() < 0.5 ? "jam" : "ham";
    hand.current.kind = k;
    setHandKind(k);
  }, []);

  // resize
  useEffect(() => {
    const el = sceneRef.current;
    const cv = canvasRef.current;
    if (!el || !cv) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      size.current = { w: r.width, h: r.height, dpr };
      cv.width = r.width * dpr;
      cv.height = r.height * dpr;
      const old = ground.current;
      const g = document.createElement("canvas");
      g.width = cv.width;
      g.height = cv.height;
      const gc = g.getContext("2d");
      if (!gc) return;
      if (old) gc.drawImage(old, 0, 0, g.width, g.height);
      ground.current = g;
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // stats UI refresh
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 150);
    return () => clearInterval(id);
  }, []);

  // main loop
  useEffect(() => {
    const cv = canvasRef.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;
    let raf = 0;
    let last = performance.now();

    const actorBox = (a: Actor) => {
      const { w, h } = size.current;
      const s = depth(a.y);
      const personHeight = Math.min(h * TOAST_CONFIG.people.heightOfScene, w * TOAST_CONFIG.people.heightOfWidth) * s;
      if (a.kind === "truck") {
        const bh = personHeight * TOAST_CONFIG.truck.heightInStudents;
        return { bw: bh * TOAST_CONFIG.truck.widthToHeight, bh, s };
      }
      const bh = personHeight * (a.kind === "chef" ? TOAST_CONFIG.people.chefScale : 1);
      return { bw: bh * (a.kind === "chef" ? 0.72 : 0.55), bh, s };
    };

    const splat = (g: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string, ring?: string) => {
      g.fillStyle = fill;
      g.beginPath();
      const pts = 16;
      for (let i = 0; i <= pts; i++) {
        const a = (i / pts) * Math.PI * 2;
        const rr = r * rnd(0.55, 1.15);
        g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.6);
      }
      g.fill();
      for (let i = 0; i < 9; i++) {
        const a = rnd(0, Math.PI * 2);
        const d = r * rnd(1.2, 2.4);
        g.beginPath();
        g.arc(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.6, r * rnd(0.06, 0.16), 0, Math.PI * 2);
        g.fill();
      }
      if (ring) {
        g.fillStyle = ring;
        g.beginPath();
        g.ellipse(x, y, r * 0.55, r * 0.33, 0, 0, Math.PI * 2);
        g.fill();
      }
    };

    const drawBack = (c: CanvasRenderingContext2D, s: number) => {
      c.fillStyle = "#b9762f";
      c.beginPath();
      c.roundRect(-s / 2, -s / 2, s, s, s * 0.18);
      c.fill();
      c.fillStyle = "#e6c07a";
      c.beginPath();
      c.roundRect(-s * 0.4, -s * 0.38, s * 0.8, s * 0.8, s * 0.14);
      c.fill();
    };

    const land = (f: Flight) => {
      const { w, h, dpr } = size.current;
      const gx = f.tx * w;
      const gy = f.ty * h;
      const gs = h * TOAST_CONFIG.throwing.groundSize * depth(f.ty);
      const gc = ground.current?.getContext("2d");
      if (gc) {
        gc.save();
        gc.setTransform(dpr, 0, 0, dpr, 0, 0);
        if (f.down) {
          if (f.kind === "jam") splat(gc, gx, gy, gs * 0.9, "rgba(170,20,30,0.85)");
          else splat(gc, gx, gy, gs * 0.75, "rgba(240,205,110,0.8)", "rgba(225,140,150,0.9)");
          gc.translate(gx, gy);
          gc.rotate(rnd(-1, 1));
          gc.scale(1, 0.62);
          drawBack(gc, gs);
        } else {
          gc.fillStyle = "rgba(190,130,60,0.9)";
          for (let i = 0; i < 10; i++) {
            gc.fillRect(gx + rnd(-gs, gs), gy + rnd(-gs * 0.5, gs * 0.5), rnd(1, 3), rnd(1, 3));
          }
          gc.translate(gx, gy);
          gc.rotate(rnd(-1, 1));
          gc.scale(1, 0.62);
          const im = imgs.current[f.kind === "jam" ? jamSrc : hamSrc];
          if (im?.complete) gc.drawImage(im, -gs / 2, -gs / 2, gs, gs);
        }
        gc.restore();
      }
      record(stats.current, f.kind, f.down);
      audio.current?.play("splat");

      // hit tests
      for (const a of actors.current) {
        if (a.kind === "truck" && truckVisit.current.phase === "waiting") continue;
        const { bw, bh } = actorBox(a);
        const point = a.kind === "student" ? courtyardPoint(a.x, a.y, w, h) : { x: a.x * w, y: a.y * h };
        const ax = point.x;
        const ay = point.y;
        if (gx > ax - bw / 2 && gx < ax + bw / 2 && gy > ay - bh && gy < ay + 4) {
          if (a.kind === "student") {
            rewardSupplyHit(supply.current, "student");
            a.hitT = TOAST_CONFIG.reactions.studentSeconds;
            audio.current?.play("student");
            bubbles.current.push({ text: t.bubbles.student[Math.floor(Math.random() * t.bubbles.student.length)] ?? "", x: ax, y: ay - bh, t: 1.3 });
          } else if (a.kind === "chef") {
            rewardSupplyHit(supply.current, "chef");
            a.hitT = TOAST_CONFIG.reactions.chefSeconds;
            audio.current?.play("chef");
            bubbles.current.push({ text: t.bubbles.chef[Math.floor(Math.random() * t.bubbles.chef.length)] ?? "", x: ax, y: ay - bh, t: 1.6, big: true });
            flash(t.banners.chefBonus(TOAST_CONFIG.bonuses.chef));
          } else if (a.kind === "truck" && !f.bonus) {
            const bonus = rewardTruckHit(truckVisit.current);
            if (!bonus) break;
            a.hitT = TOAST_CONFIG.reactions.truckSeconds;
            audio.current?.play("truck");
            bubbles.current.push({ text: t.bubbles.truck, x: ax, y: ay - bh, t: 2, big: true });
            bursts.current.push({ left: bonus, every: TOAST_CONFIG.truck.dropIntervalSeconds, acc: 0, fromSky: true });
            flash(t.banners.truckBonus(bonus));
          }
          break;
        }
      }
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const { w, h, dpr } = size.current;

      if (!paused.current) {
        // holding
        hand.current.cooldown -= dt;
        if (holding.current) {
          holdAcc.current += dt;
          if (holdAcc.current >= TOAST_CONFIG.throwing.holdIntervalSeconds) {
            holdAcc.current = 0;
            launch(false);
          }
        }
        // bursts
        for (const b of bursts.current) {
          b.acc += dt;
          while (b.acc >= b.every && b.left > 0) {
            b.acc -= b.every;
            b.left--;
            launch(true, { around: b.around ?? { x: rnd(0.15, 0.85), y: rnd(0.45, 0.8) }, fromSky: b.fromSky });
          }
        }
        bursts.current = bursts.current.filter((b) => b.left > 0);
        // actors
        advanceTruck(truckVisit.current, dt);
        for (const a of actors.current) {
          const panic = a.hitT > 0 ? TOAST_CONFIG.reactions.panicSpeed : 1;
          if (a.kind === "truck") {
            a.x = truckVisit.current.x;
          } else {
            advanceWalker(a, dt * panic);
          }
          a.hitT = Math.max(0, a.hitT - dt);
        }
        // flights
        const done: Flight[] = [];
        for (const f of flights.current) {
          f.t += dt / f.dur;
          if (f.t >= 1) done.push(f);
        }
        if (done.length) {
          flights.current = flights.current.filter((f) => f.t < 1);
          done.forEach(land);
        }
        for (const b of bubbles.current) b.t -= dt;
        bubbles.current = bubbles.current.filter((b) => b.t > 0);
        checkMilestone();
      }

      // draw
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      // A hidden scene (e.g. iframe not shown yet) has a 0×0 canvas; drawing it would throw and stop the loop.
      if (ground.current && ground.current.width > 0 && ground.current.height > 0) ctx.drawImage(ground.current, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const sorted = [...actors.current].sort((a, b) => a.y - b.y);
      for (const a of sorted) {
        if (a.kind === "truck" && truckVisit.current.phase === "waiting") continue;
        const im = imgs.current[a.img];
        if (!im?.complete) continue;
        const { bw, bh } = actorBox(a);
        const point = a.kind === "student" ? courtyardPoint(a.x, a.y, w, h) : { x: a.x * w, y: a.y * h };
        const ax = point.x;
        const ay = point.y;
        ctx.save();
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.beginPath();
        ctx.ellipse(ax, ay, bw * 0.45, bw * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.translate(ax, ay);
        if (a.hitT > 0 && a.kind !== "truck") ctx.rotate(Math.sin(now / 40) * 0.12);
        const bob = a.kind === "truck" ? 0 : Math.abs(Math.sin(now / 180 + a.x * 20)) * 3;
        if (a.vx < 0) ctx.scale(-1, 1); // truck.png is pre-mirrored so its sign reads correctly here
        ctx.filter = "drop-shadow(3px 4px 0 rgba(0,0,0,0.35))";
        if (a.kind === "truck") ctx.drawImage(im, 21, 38, 998, 555, -bw / 2, -bh, bw, bh);
        else ctx.drawImage(im, -bw / 2, -bh - bob, bw, bh);
        ctx.restore();
      }

      // flights (far ones first)
      const fl = [...flights.current].sort((a, b) => b.t - a.t);
      for (const f of fl) {
        const p = Math.pow(f.t, 1.5);
        const x = f.sx + (f.tx * w - f.sx) * p;
        const y = f.sy + (f.ty * h - f.sy) * p - Math.sin(Math.PI * f.t) * h * 0.08;
        const gs = h * TOAST_CONFIG.throwing.groundSize * depth(f.ty);
        const s = f.ss + (gs - f.ss) * p;
        const ang = f.halfTurns * Math.PI * f.t;
        const c = Math.cos(ang);
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(f.spin * f.t);
        ctx.scale(1, Math.max(0.06, Math.abs(c)) * (c < 0 ? -1 : 1));
        if (c >= 0) {
          const im = imgs.current[f.kind === "jam" ? jamSrc : hamSrc];
          if (im?.complete) ctx.drawImage(im, -s / 2, -s / 2, s, s);
        } else drawBack(ctx, s);
        ctx.restore();
      }

      // hand + held toast
      const g = handGeom();
      const himg = imgs.current[handSrc];
      if (himg?.complete) ctx.drawImage(himg, g.hx, g.hy, g.hs, g.hs);
      if (supply.current.remaining > 0 && (hand.current.cooldown <= 0 || holding.current)) {
        const tim = imgs.current[hand.current.kind === "jam" ? jamSrc : hamSrc];
        if (tim?.complete && hand.current.cooldown <= 0) {
          ctx.save();
          ctx.translate(g.tx, g.ty);
          ctx.rotate(0.14);
          ctx.filter = "drop-shadow(4px 8px 6px rgba(0,0,0,0.4))";
          ctx.drawImage(tim, -g.ts / 2, -g.ts / 2, g.ts, g.ts);
          ctx.restore();
        }
      }
      // Only the thumb sits in front of the toast; the palm/index finger stay behind it.
      if (himg?.complete && hand.current.cooldown <= 0) {
        ctx.save();
        ctx.translate(g.hx, g.hy);
        ctx.scale(g.hs, g.hs);
        ctx.beginPath();
        ctx.moveTo(0.52, 0.43);
        ctx.bezierCurveTo(0.62, 0.40, 0.70, 0.32, 0.79, 0.35);
        ctx.bezierCurveTo(0.86, 0.42, 0.70, 0.50, 0.57, 0.56);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(himg, 0, 0, 1, 1);
        ctx.restore();
      }

      // bubbles
      for (const b of bubbles.current) {
        const fs = b.big ? 22 : 16;
        ctx.font = `${fs}px "Bowlby One", sans-serif`;
        const tw = ctx.measureText(b.text).width;
        const bx = b.x - tw / 2 - 10;
        const by = b.y - fs - 26 - (1.5 - b.t) * 10;
        ctx.fillStyle = b.big ? "#ffd23f" : "#fff";
        ctx.strokeStyle = "#1a1a1a";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(bx, by, tw + 20, fs + 14, 10);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#1a1a1a";
        ctx.fillText(b.text, bx + 10, by + fs + 3);
      }

      // aim reticle
      ctx.strokeStyle = "rgba(255,255,255,0.8)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(aim.current.x * w, aim.current.y * h, 18, 10, 0, 0, Math.PI * 2);
      ctx.stroke();

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [launch, handGeom]);

  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function flash(text: string) {
    setBanner(text);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setBanner(null), TOAST_CONFIG.bannerSeconds * 1000);
  }

  function checkMilestone() {
    if (paused.current) return;
    const N = stats.current.jam.n + stats.current.ham.n;
    if (supply.current.remaining === 0) {
      holding.current = false;
      holdAcc.current = 0;
      if (!canOpenEmptyLab(supply.current, bursts.current.length, flights.current.length)) return;
      MILESTONES.filter((m) => N >= m).forEach((m) => seen.current.add(m));
      reportRequested.current = false;
      paused.current = true;
      setEmptyLab(true);
      setMilestone(N);
      return;
    }
    if (!shouldDrainForNotebook(lab.current, N, seen.current, reportRequested.current)) return;
    holding.current = false;
    holdAcc.current = 0;
    if (!canOpenNotebook(lab.current, bursts.current.length, flights.current.length, holding.current)) return;
    const crossed = MILESTONES.filter((m) => N >= m && !seen.current.has(m));
    const latest = crossed.at(-1);
    if (latest == null && !reportRequested.current) return;
    reportRequested.current = false;
    crossed.forEach((m) => seen.current.add(m));
    paused.current = true;
    setMilestone(N);
  }

  function finishRound(guess: Kind | null) {
    const result = evaluateRound(round, guess, odds.current, stats.current.jam.n + stats.current.ham.n);
    setResults(old => [...old, result]);
    setRoundResult(result);
    setMilestone(null);
    setReportOpen(false);
    holding.current = false;
    paused.current = true;
  }
  function continueRound() {
    setMilestone(null);
    setReportOpen(false);
    setEmptyLab(false);
    paused.current = false;
    holding.current = false;
  }
  function completeRevive(answers: number[]) {
    if (!evaluateReviveTest(answers).passed) { finishRound(null); return; }
    reviveSupply(supply.current);
    continueRound();
  }

  // controls
  const onPointerMove = (e: React.PointerEvent) => {
    const r = sceneRef.current?.getBoundingClientRect();
    if (!r) return;
    aim.current = { x: (e.clientX - r.left) / r.width, y: Math.max(TOAST_CONFIG.throwing.minAimY, (e.clientY - r.top) / r.height) };
  };
  const startHold = () => {
    if (introOpen || debrief || roundResult !== null || supply.current.remaining === 0 || paused.current || shouldDrainForNotebook(lab.current, stats.current.jam.n + stats.current.ham.n, seen.current, reportRequested.current)) return;
    void audio.current?.unlock();
    launch(false);
    holding.current = true;
    holdAcc.current = TOAST_CONFIG.throwing.holdStartSeconds;
  };
  const stopHold = () => {
    holding.current = false;
  };
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest("button, input, select, textarea")) return;
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        startHold();
      }
    };
    const up = (e: KeyboardEvent) => e.code === "Space" && stopHold();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  });

  const resetScene = () => {
    odds.current = createOdds();
    stats.current = createStats();
    supply.current = createSupply();
    setEmptyLab(false);
    setDebrief(false);
    paused.current = false;
    holding.current = false;
    reportRequested.current = false;
    bubbles.current = [];
    setMilestone(null);
    setReportOpen(false);
    setBanner(null);
    seen.current.clear();
    flights.current = [];
    bursts.current = [];
    truckVisit.current = createTruckVisit();
    const truck = actors.current.find((actor) => actor.kind === "truck");
    if (truck) { truck.x = TOAST_CONFIG.truck.outsideX; truck.hitT = 0; }
    const g = ground.current;
    g?.getContext("2d")?.clearRect(0, 0, g.width, g.height);
  };
  const resetAll = () => {
    resetScene();
    setRound(1);
    setResults([]);
    setRoundResult(null);
  };
  const nextRound = () => {
    setRoundResult(null);
    if (round === TOAST_CONFIG.rounds.count) { setDebrief(true); return; }
    resetScene();
    setRound(value => value + 1);
  };
  const hose = () => {
    const sound = audio.current;
    if (sound) void sound.unlock().then(() => sound.play("hose"));
    const g = ground.current;
    g?.getContext("2d")?.clearRect(0, 0, g.width, g.height);
  };

  const s = stats.current;
  const N = s.jam.n + s.ham.n;
  const jr = rate(s.jam);
  const hr = rate(s.ham);
  const correctRounds = results.filter(result => result.correct).length;
  const score = finalScorePoints(correctRounds);
  const totalRounds = TOAST_CONFIG.rounds.count;
  const finish = () => onFinish?.({
    correctRounds,
    rounds: totalRounds,
    results: results.map(({ round, correct, guess, reason, n, odds }) => ({ round, correct, guess, reason, n, odds: { ...odds } })),
  });

  return (
    <div className="flex h-dvh min-h-[360px] flex-col overflow-hidden bg-paper text-ink sm:min-h-[480px]">
      {/* Scene */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div
          ref={sceneRef}
          className="absolute inset-0 cursor-crosshair touch-none select-none bg-cover bg-center"
          style={{ backgroundImage: `url(${courtyardSrc})` }}
          onPointerMove={onPointerMove}
          onPointerDown={(e) => {
            onPointerMove(e);
            startHold();
          }}
          onPointerUp={stopHold}
          onPointerCancel={stopHold}
          onPointerLeave={stopHold}
        >
          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
        </div>

        <header className="absolute inset-x-0 top-0 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 bg-paper/95 px-3 py-2 sm:flex sm:flex-wrap sm:justify-between sm:px-5">
          <h1 className="font-display truncate text-xs sm:text-xl">{t.header.title}</h1>
          <nav className="flex shrink-0 items-center gap-0.5 sm:gap-1" aria-label={t.header.controls}>
            <span className="mr-1 text-[10px] font-bold sm:mr-2 sm:text-xs" aria-label={t.header.scoreLabel}>{t.header.score(round, totalRounds, score)}</span>
            <Button size="icon" variant="ghost" title={t.header.labReport} aria-label={t.header.labReport} onClick={() => { holding.current = false; reportRequested.current = true; flash(flights.current.length || bursts.current.length ? t.banners.settle : t.banners.labReport); }}><BookOpen /></Button>
            <Button size="icon" variant="ghost" title={soundOn ? t.header.mute : t.header.unmute} aria-label={soundOn ? t.header.mute : t.header.unmute} onClick={() => { const enabled = !soundOn; setSoundOn(enabled); const sound = audio.current; if (sound) { sound.enabled = enabled; if (enabled) void sound.unlock().then(() => sound.play("drop")); } }}>{soundOn ? <Volume2 /> : <VolumeX />}</Button>
            <Button size="icon" variant="ghost" title={t.header.hose} aria-label={t.header.hose} onClick={hose}><Droplets /></Button>
            {!onFinish && <Button size="icon" variant="ghost" title={t.header.newExperiment} aria-label={t.header.newExperiment} onClick={resetAll}><RotateCcw /></Button>}
          </nav>
        </header>

        <div className="pointer-events-none absolute bottom-3 right-3 rotate-2 bg-paper px-2 py-1.5 text-xs font-bold shadow-cut sm:bottom-4 sm:right-4 sm:px-3 sm:py-2 sm:text-sm">
          <p className="font-display tabular-nums" aria-label={t.stock.label}>{t.stock.count(supply.current.remaining)}</p>
          {supply.current.remaining > 0 ? <span className={handKind === "jam" ? "text-jam" : "text-ham"}>{t.stock[handKind]}</span> : <span>{t.stock.empty}</span>}
        </div>

        {banner && (
          <div className="pointer-events-none absolute inset-x-0 top-1/3 flex justify-center">
            <div className="font-display animate-in zoom-in -rotate-3 border-4 border-ink bg-mustard px-6 py-3 max-w-[90vw] text-center text-xl text-ink shadow-cut sm:text-4xl">
              {banner}
            </div>
          </div>
        )}

      </div>

      <footer className="flex h-[104px] shrink-0 items-center gap-2 border-t-2 border-ink/20 bg-paper px-2 sm:h-[118px] sm:gap-6 sm:px-5" aria-label={t.footer.label}>
        <div className="w-[104px] shrink-0 sm:w-[160px]">
          <p className="font-display text-xs sm:text-sm">N = {formatNumber(N)}</p>
          <p className="hidden text-[10px] font-semibold text-ink/60 sm:block">{t.footer.toppingDown}</p>
          {(["jam", "ham"] as const).map((kind) => <div key={kind} className="flex items-center gap-1 sm:gap-1.5">
            <img src={kind === "jam" ? jamSrc : hamSrc} alt={t.footer.toastAlt(t.kinds[kind])} className="h-5 w-5 object-contain sm:h-7 sm:w-7" />
            <span className={`text-[10px] font-bold sm:text-xs ${kind === "jam" ? "text-jam" : "text-plot-ham"}`}>{t.kinds[kind]}</span>
            <span className="ml-auto text-xs font-bold tabular-nums sm:text-sm">{s[kind].n ? formatPercent(rate(s[kind]), 1) : "—"}</span>
          </div>)}
        </div>
        <div className="min-w-0 flex-1"><ConvergenceChart stats={s} compact /></div>
      </footer>
      {(milestone != null || reportOpen) && <RoundLab key={`${round}-${milestone}`} stats={s} round={round} rounds={totalRounds} empty={emptyLab} onContinue={continueRound} onGuess={finishRound} onTest={completeRevive} />}
      {roundResult && <div className="absolute inset-0 z-40 flex items-center justify-center bg-ink/70 p-4">
        <section role="dialog" aria-modal="true" aria-label={t.result.dialog} className="w-full max-w-xl border-4 border-ink bg-paper p-5 shadow-cut">
          <p className="font-display text-sm text-jam">{t.result.kicker(roundResult.round, totalRounds)}</p>
          <h2 className="font-display mt-2 text-2xl">{roundResult.correct ? t.result.titleCorrect : t.result.titleLost}</h2>
          <p className="mt-3 text-sm">{roundResult.reason === "test" || !roundResult.guess ? t.result.testFailed : t.result.guessed(t.kinds[roundResult.guess])} {t.result.trueOdds(formatPercent(roundResult.odds.jam), formatPercent(roundResult.odds.ham), roundResult.n)}</p>
          <p className="mt-2 font-bold">{roundResult.correct ? t.result.gainCorrect(totalRounds) : t.result.gainNone} · {t.result.score(score)}</p>
          <Button className="mt-4 w-full bg-jam text-paper hover:bg-jam/90" onClick={nextRound}>{round === totalRounds ? t.result.seeFinal : t.result.nextRound(round + 1)}</Button>
        </section>
      </div>}
      {introOpen && <div className="absolute inset-0 z-40 overflow-y-auto bg-ink/70 p-4">
        <section role="dialog" aria-modal="true" aria-label={t.intro.dialog} className="mx-auto max-w-3xl border-4 border-ink bg-paper p-5 shadow-cut">
          <p className="font-display text-sm text-jam">{t.intro.kicker}</p>
          <h2 className="font-display text-2xl leading-tight sm:text-3xl">{t.intro.title}</h2>
          <p className="mt-2 text-sm">{t.intro.lead}</p>
          <div className="mt-4"><ComicStrip panels={INTRO_PANELS} /></div>
          <div className="mt-5 border-l-4 border-mustard bg-mustard/15 p-3 text-sm">
            {t.intro.mission}
          </div>
          <Button className="font-display mt-4 w-full border-4 border-ink bg-jam py-5 text-lg text-paper shadow-cut hover:bg-jam/90" onClick={() => { setIntroOpen(false); const sound = audio.current; if (sound) void sound.unlock().then(() => sound.play("drop")); }}>{t.intro.start}</Button>
        </section>
      </div>}
      {debrief && (() => {
        const pct = score;
        return <div className="absolute inset-0 z-40 overflow-y-auto bg-ink/70 p-4">
          <section role="dialog" aria-modal="true" aria-label={t.debrief.dialog} className="mx-auto max-w-3xl border-4 border-ink bg-paper p-5 shadow-cut">
            <p className="font-display text-sm text-jam">{t.debrief.kicker(formatNumber(N))}</p>
            <h2 className="font-display text-2xl leading-tight sm:text-3xl">{pct >= TOAST_CONFIG.debrief.topPercent ? t.debrief.titleTop : pct >= TOAST_CONFIG.debrief.midPercent ? t.debrief.titleMid : t.debrief.titleLow}</h2>
            <p className="mt-2 text-sm font-bold">{t.debrief.summary(pct, correctRounds, totalRounds)}</p>
            <ul className="mt-3 space-y-2 text-sm">{results.map(result => <li key={result.round} className="border-b border-ink/15 pb-2"><b>{t.debrief.round(result.round)}</b> {result.correct ? t.debrief.roundCorrect(totalRounds) : result.reason === "test" ? t.debrief.roundTestFailed : t.debrief.roundWrong} · {t.debrief.roundOdds(result.n, formatPercent(result.odds.jam), formatPercent(result.odds.ham))}</li>)}</ul>
            <div className="mt-4"><ConvergenceChart stats={s} /></div>
            <div className="mt-3 border-l-4 border-mustard bg-mustard/15 p-3 text-sm">
              {t.debrief.explanation}
            </div>
            <h3 className="font-display mt-6 text-xl">{t.debrief.outroTitle}</h3>
            <div className="mt-3"><ComicStrip panels={OUTRO_PANELS} /></div>
            {onFinish
              ? <Button className="font-display mt-5 w-full border-4 border-ink bg-jam py-5 text-lg text-paper shadow-cut hover:bg-jam/90" onClick={finish}>{t.debrief.finish}</Button>
              : <Button className="font-display mt-5 w-full border-4 border-ink bg-jam py-5 text-lg text-paper shadow-cut hover:bg-jam/90" onClick={() => { setDebrief(false); resetAll(); }}>{t.debrief.newExperiment}</Button>}
          </section>
        </div>;
      })()}
    </div>
  );
}

