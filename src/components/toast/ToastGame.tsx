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
import { BookOpen, Gamepad2, RotateCcw, Volume2, VolumeX, Droplets, X, Eye } from "lucide-react";
import { ToastAudio } from "@/lib/toast-audio";

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

const STUDENT_LINES = ["EWW!", "MY HOODIE!", "WHO DID THAT?!", "Not again…", "Murphy!!", "IN MY HAIR?"];
const CHEF_LINES = ["MON DIEU!", "MY TRAY!", "AAARGH!", "SACRÉ TOAST!"];
const depth = (y: number) => 0.35 + 0.9 * y;
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const studentImages = { student1: s1Src, student2: s2Src, student3: s3Src, student4: s4Src, student5: s5Src, student6: s6Src };

type Journal = { n: number; which: string; gap: string; jam: number; ham: number };

export function ToastGame() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgs = useRef<Record<string, HTMLImageElement>>({});
  const stats = useRef<Stats>(createStats());
  const odds = useRef(createOdds());
  const audio = useRef<ToastAudio | null>(null);
  const lab = useRef(true);
  const [labMode, setLabMode] = useState(true);
  const [reportOpen, setReportOpen] = useState(false);
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
    { kind: "chef", img: chefSrc, x: 0.45, y: 0.6, vx: 0.07, hitT: 0, say: "", min: 0.25, max: 0.8 },
    ...TOAST_CONFIG.students.map((student): Actor => ({ kind: "student", img: studentImages[student.image], x: student.x, ...TOAST_CONFIG.walkingPaths[student.path], vx: student.speed, hitT: 0, say: "" })),
  ]);

  const [, setTick] = useState(0);
  const [handKind, setHandKind] = useState<Kind>("jam");
  const [milestone, setMilestone] = useState<number | null>(null);
  const [answer, setAnswer] = useState<{ which?: string; gap?: string }>({});
  const [journal, setJournal] = useState<Journal[]>([]);
  const [revealed, setRevealed] = useState(false);
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
      const { w, h } = size.current;
      const kind: Kind = bonus ? (Math.random() < 0.5 ? "jam" : "ham") : hand.current.kind;
      const down = rollDown(kind, odds.current);
      const g = handGeom();
      let tx: number, ty: number;
      if (opts?.around) {
        tx = opts.around.x + rnd(-0.12, 0.12);
        ty = opts.around.y + rnd(-0.1, 0.1);
      } else {
        tx = aim.current.x + rnd(-0.04, 0.04);
        ty = aim.current.y + rnd(-0.04, 0.04);
      }
      tx = Math.min(0.98, Math.max(0.02, tx));
      ty = Math.min(0.97, Math.max(0.25, ty));
      const sx = opts?.fromSky ? tx * w + rnd(-60, 60) : g.tx;
      const sy = opts?.fromSky ? -40 : g.ty;
      const turns = 1 + Math.floor(Math.random() * 3);
      flights.current.push({
        kind, down, sx, sy, ss: opts?.fromSky ? g.ts * 0.4 : g.ts, tx, ty, t: 0,
        dur: rnd(0.9, 1.25), halfTurns: turns * 2 + (down ? 1 : 0), spin: rnd(-3, 3), bonus,
      });
      if (!bonus) {
        audio.current?.play("drop");
        const next: Kind = Math.random() < 0.5 ? "jam" : "ham";
        hand.current = { kind: next, cooldown: 0.12 };
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
      const gs = h * 0.055 * depth(f.ty);
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
            a.hitT = 1.2;
            audio.current?.play("student");
            bubbles.current.push({ text: STUDENT_LINES[Math.floor(Math.random() * STUDENT_LINES.length)] ?? "EWW!", x: ax, y: ay - bh, t: 1.3 });
          } else if (a.kind === "chef" && !f.bonus) {
            a.hitT = 1.6;
            audio.current?.play("chef");
            bubbles.current.push({ text: CHEF_LINES[Math.floor(Math.random() * CHEF_LINES.length)] ?? "SACRÉ TOAST!", x: ax, y: ay - bh, t: 1.6, big: true });
            bursts.current.push({ left: TOAST_CONFIG.bonuses.chef, every: 0.06, acc: 0, fromSky: false, around: { x: a.x, y: a.y } });
            flash(`+${TOAST_CONFIG.bonuses.chef} TOAST BARRAGE!`);
          } else if (a.kind === "truck" && !f.bonus) {
            const bonus = rewardTruckHit(truckVisit.current);
            if (!bonus) break;
            a.hitT = 2;
            audio.current?.play("truck");
            bubbles.current.push({ text: "HONK!! CARGO DOOR!", x: ax, y: ay - bh, t: 2, big: true });
            bursts.current.push({ left: bonus, every: TOAST_CONFIG.truck.dropIntervalSeconds, acc: 0, fromSky: true });
            flash(`+${bonus} BULK BREAD DROP!`);
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
          if (holdAcc.current >= 0.12) {
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
          const panic = a.hitT > 0 ? 2.5 : 1;
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
      if (ground.current) ctx.drawImage(ground.current, 0, 0);
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
        if (a.vx < 0) ctx.scale(-1, 1);
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
        const gs = h * 0.055 * depth(f.ty);
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
      if (hand.current.cooldown <= 0 || holding.current) {
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
    flashTimer.current = setTimeout(() => setBanner(null), 1800);
  }

  function checkMilestone() {
    if (paused.current) return;
    const N = stats.current.jam.n + stats.current.ham.n;
    if (!shouldDrainForNotebook(lab.current, N, seen.current, reportRequested.current)) return;
    holding.current = false;
    holdAcc.current = 0;
    if (!canOpenNotebook(lab.current, bursts.current.length, flights.current.length, holding.current)) return;
    if (reportRequested.current) {
      reportRequested.current = false;
      paused.current = true;
      setReportOpen(true);
      return;
    }
    const crossed = MILESTONES.filter((m) => N >= m && !seen.current.has(m));
    const latest = crossed.at(-1);
    if (latest == null) return;
    crossed.forEach((m) => seen.current.add(m));
    paused.current = true;
    setAnswer({});
    setMilestone(N);
  }

  function submitMilestone() {
    if (milestone == null || !answer.which || !answer.gap) return;
    const entry = { n: milestone, which: answer.which, gap: answer.gap, jam: rate(stats.current.jam), ham: rate(stats.current.ham) };
    setJournal((j) => [...j, entry]);
    setMilestone(null);
    paused.current = false;
  }

  // controls
  const onPointerMove = (e: React.PointerEvent) => {
    const r = sceneRef.current?.getBoundingClientRect();
    if (!r) return;
    aim.current = { x: (e.clientX - r.left) / r.width, y: Math.max(0.28, (e.clientY - r.top) / r.height) };
  };
  const startHold = () => {
    if (paused.current || shouldDrainForNotebook(lab.current, stats.current.jam.n + stats.current.ham.n, seen.current, reportRequested.current)) return;
    void audio.current?.unlock();
    launch(false);
    holding.current = true;
    holdAcc.current = -0.25;
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

  const resetAll = () => {
    odds.current = createOdds();
    stats.current = createStats();
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
    setJournal([]);
    setRevealed(false);
    const g = ground.current;
    g?.getContext("2d")?.clearRect(0, 0, g.width, g.height);
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
  const lastJ = journal.at(-1);
  const lastGap = lastJ ? Math.abs(lastJ.ham - lastJ.jam) : null;

  return (
    <div className="flex h-dvh min-h-[480px] flex-col overflow-hidden bg-paper text-ink">
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
          onPointerLeave={stopHold}
        >
          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
        </div>

        <header className="absolute inset-x-0 top-0 flex flex-wrap items-center justify-between gap-2 bg-paper/95 px-3 py-2 sm:px-5">
          <h1 className="font-display text-sm sm:text-xl">MURPHY'S TOAST LAB</h1>
          <nav className="flex items-center gap-1" aria-label="Game controls">
            <div className="mr-1 flex border border-ink/20 rounded-md">
              <Button size="sm" variant="ghost" aria-pressed={!labMode} className={!labMode ? "bg-ink text-paper hover:bg-ink/90 hover:text-paper" : ""} onClick={() => { lab.current = false; setLabMode(false); resetAll(); }}><Gamepad2 />Play</Button>
              <Button size="sm" variant="ghost" aria-pressed={labMode} className={labMode ? "bg-ink text-paper hover:bg-ink/90 hover:text-paper" : ""} onClick={() => { lab.current = true; setLabMode(true); resetAll(); }}><BookOpen />Lab session</Button>
            </div>
            {labMode && <Button size="icon" variant="ghost" title="Lab report" aria-label="Lab report" onClick={() => { holding.current = false; reportRequested.current = true; flash(flights.current.length || bursts.current.length ? "LET THE TOAST SETTLE…" : "LAB REPORT"); }}><BookOpen /></Button>}
            <Button size="icon" variant="ghost" title={soundOn ? "Mute sounds" : "Enable sounds"} aria-label={soundOn ? "Mute sounds" : "Enable sounds"} onClick={() => { const enabled = !soundOn; setSoundOn(enabled); const sound = audio.current; if (sound) { sound.enabled = enabled; if (enabled) void sound.unlock().then(() => sound.play("drop")); } }}>{soundOn ? <Volume2 /> : <VolumeX />}</Button>
            <Button size="icon" variant="ghost" title="Hose down courtyard" aria-label="Hose down courtyard" onClick={hose}><Droplets /></Button>
            <Button size="icon" variant="ghost" title="New experiment" aria-label="New experiment" onClick={resetAll}><RotateCcw /></Button>
          </nav>
        </header>

        <div className="pointer-events-none absolute bottom-4 right-4 rotate-2 bg-paper px-3 py-2 text-sm font-bold shadow-cut">
          In hand:{" "}
          <span className={handKind === "jam" ? "text-jam" : "text-ham"}>{handKind === "jam" ? "JAM TOAST" : "HAM TOAST"}</span>
        </div>

        {banner && (
          <div className="pointer-events-none absolute inset-x-0 top-1/3 flex justify-center">
            <div className="font-display animate-in zoom-in -rotate-3 border-4 border-ink bg-mustard px-6 py-3 max-w-[90vw] text-center text-xl text-ink shadow-cut sm:text-4xl">
              {banner}
            </div>
          </div>
        )}

        {milestone != null && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-ink/50 p-4">
            <div role="dialog" aria-modal="true" aria-label="Lab notebook" className="max-h-[90%] w-full max-w-md overflow-y-auto border-4 border-ink bg-paper p-5 shadow-cut">
              <p className="font-display text-sm text-jam">CHECKPOINT · N = {milestone}</p>
              <h2 className="font-display mt-1 text-2xl leading-tight">Lab notebook time!</h2>
              <p className="mt-2 text-sm">
                So far: Jam lands face-down <b>{(jr * 100).toFixed(1)}%</b> ({s.jam.n} drops), Ham <b>{(hr * 100).toFixed(1)}%</b> ({s.ham.n} drops).
              </p>
              <Q
                label="1. Which topping do you think truly lands face-down more often?"
                options={["Jam", "Ham", "Same", "Can't tell yet"]}
                value={answer.which}
                onPick={(v) => setAnswer((a) => ({ ...a, which: v }))}
              />
              <Q
                label={`2. Since ${lastGap == null ? "the start" : "your last checkpoint"}, is the gap between the lines…`}
                options={["Widening", "Narrowing", "Holding steady"]}
                value={answer.gap}
                onPick={(v) => setAnswer((a) => ({ ...a, gap: v }))}
              />
              {answer.which && answer.gap && (
                <p className="mt-3 border-l-4 border-mustard bg-mustard/15 p-2 text-xs">
                  {milestone < 50
                    ? "With so few drops, a handful of lucky bounces can swing the average a lot. Trust it less than you want to!"
                    : milestone < 500
                      ? "Notice how each new drop nudges the line less and less? Each toast is now a small slice of a big sample."
                      : "The lines are flattening out. This is the Law of Large Numbers: the running average settles near the true probability."}
                  {lastGap != null && ` Gap now: ${(Math.abs(hr - jr) * 100).toFixed(1)} pts (was ${(lastGap * 100).toFixed(1)}).`}
                </p>
              )}
              <Button
                disabled={!answer.which || !answer.gap}
                onClick={submitMilestone}
                className="font-display mt-4 w-full border-4 border-ink bg-jam py-2 text-lg text-paper shadow-cut transition hover:-translate-y-0.5 disabled:opacity-40"
              >
                LOG IT & KEEP DROPPING
              </Button>
            </div>
          </div>
        )}
      </div>

      <footer className="flex h-[118px] shrink-0 items-center gap-3 border-t-2 border-ink/20 bg-paper px-3 sm:gap-6 sm:px-5" aria-label="Live experiment averages">
        <div className="w-[110px] shrink-0 sm:w-[160px]">
          <p className="font-display text-sm">N = {N.toLocaleString()}</p>
          <p className="text-[10px] font-semibold text-ink/60">TOPPING-DOWN</p>
          {(["jam", "ham"] as const).map((kind) => <div key={kind} className="flex items-center gap-1.5">
            <img src={kind === "jam" ? jamSrc : hamSrc} alt={`${kind} toast`} className="h-7 w-7 object-contain" />
            <span className={`text-xs font-bold ${kind === "jam" ? "text-jam" : "text-plot-ham"}`}>{kind === "jam" ? "Jam" : "Ham"}</span>
            <span className="ml-auto text-sm font-bold tabular-nums">{s[kind].n ? (rate(s[kind]) * 100).toFixed(1) + "%" : "—"}</span>
          </div>)}
        </div>
        <div className="min-w-0 flex-1"><ConvergenceChart stats={s} compact /></div>
      </footer>
      {labMode && reportOpen && <div className="absolute inset-0 z-30 flex items-center justify-center bg-ink/50 p-4">
        <section role="dialog" aria-modal="true" aria-label="Lab session report" className="max-h-[90dvh] w-full max-w-xl overflow-y-auto border-4 border-ink bg-paper p-5 shadow-cut">
          <div className="flex items-center justify-between"><h2 className="font-display text-xl">Lab session report</h2><Button size="icon" variant="ghost" aria-label="Close report" onClick={() => { setReportOpen(false); paused.current = false; }}><X /></Button></div>
          <p className="mt-2 text-sm font-bold">{N.toLocaleString()} landings · Jam {(jr * 100).toFixed(1)}% · Ham {(hr * 100).toFixed(1)}%</p>
          <ConvergenceChart stats={s} />
          <div className="flex justify-center gap-4 text-xs font-bold"><span className="text-jam">━ Jam</span><span className="text-plot-ham">┄ Ham</span></div>
          <h3 className="font-display mt-5 text-base">Hypothesis journal</h3>
          {journal.length === 0 ? <p className="mt-2 text-sm text-ink/60">No observations recorded yet.</p> : <ul className="mt-2 space-y-2 text-sm">{journal.map((j) => <li key={j.n} className="border-b border-ink/15 pb-2"><b>N={j.n}:</b> {j.which} · gap {j.gap.toLowerCase()} · Jam {(j.jam * 100).toFixed(1)}% / Ham {(j.ham * 100).toFixed(1)}%</li>)}</ul>}
          {N >= 1000 && !revealed && <Button variant="outline" className="mt-4" onClick={() => setRevealed(true)}><Eye />Reveal true odds</Button>}
          {revealed && <p className="mt-3 bg-mustard/20 p-3 text-sm">This experiment's secret odds: Jam <b>{Math.round(odds.current.jam * 100)}%</b>, Ham <b>{Math.round(odds.current.ham * 100)}%</b>.</p>}
          <Button className="mt-4 w-full bg-ink text-paper hover:bg-ink/90" onClick={() => { setReportOpen(false); paused.current = false; }}>Back to the courtyard</Button>
        </section>
      </div>}
    </div>
  );
}

function Q({ label, options, value, onPick }: { label: string; options: string[]; value: string | undefined; onPick: (v: string) => void }) {
  return (
    <div className="mt-3">
      <p className="text-sm font-semibold">{label}</p>
      <div className="mt-1 flex flex-wrap gap-2">
        {options.map((o) => (
          <Button
            key={o}
            variant="outline"
            aria-pressed={value === o}
            onClick={() => onPick(o)}
            className={`border-2 border-ink px-3 py-1 text-xs font-bold ${value === o ? "bg-ink text-paper" : "bg-card hover:bg-mustard/30"}`}
          >
            {o}
          </Button>
        ))}
      </div>
    </div>
  );
}
