import { useCallback, useEffect, useRef, useState } from "react";
import courtyardSrc from "@/assets/courtyard.jpg";
import jamSrc from "@/assets/toast-jam.png";
import hamSrc from "@/assets/toast-ham.png";
import handSrc from "@/assets/hand.png";
import chefSrc from "@/assets/chef.png";
import truckSrc from "@/assets/truck.png";
import s1Src from "@/assets/student1.png";
import s2Src from "@/assets/student2.png";
import { MILESTONES, P_DOWN, createStats, rate, record, rollDown, type Kind, type Stats } from "@/lib/toast-sim";
import { ConvergenceChart } from "./ConvergenceChart";

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

type Journal = { n: number; which: string; gap: string; jam: number; ham: number };

export function ToastGame() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgs = useRef<Record<string, HTMLImageElement>>({});
  const stats = useRef<Stats>(createStats());
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
  const actors = useRef<Actor[]>([
    { kind: "truck", img: truckSrc, x: 0.78, y: 0.36, vx: 0.015, hitT: 0, say: "", min: 0.62, max: 0.86 },
    { kind: "chef", img: chefSrc, x: 0.45, y: 0.6, vx: 0.07, hitT: 0, say: "", min: 0.25, max: 0.8 },
    { kind: "student", img: s1Src, x: 0.3, y: 0.48, vx: 0.05, hitT: 0, say: "", min: 0.12, max: 0.9 },
    { kind: "student", img: s2Src, x: 0.7, y: 0.72, vx: -0.06, hitT: 0, say: "", min: 0.3, max: 0.92 },
    { kind: "student", img: s1Src, x: 0.55, y: 0.85, vx: -0.04, hitT: 0, say: "", min: 0.35, max: 0.95 },
    { kind: "student", img: s2Src, x: 0.2, y: 0.4, vx: 0.035, hitT: 0, say: "", min: 0.1, max: 0.6 },
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
    return { hs, hx: -hs * 0.12, hy: h - hs * 0.82, tx: -hs * 0.12 + hs * 0.6, ty: h - hs * 0.82 + hs * 0.36, ts: hs * 0.5 };
  }, []);

  const launch = useCallback(
    (bonus: boolean, opts?: { around?: { x: number; y: number }; fromSky?: boolean }) => {
      const { w, h } = size.current;
      const kind: Kind = bonus ? (Math.random() < 0.5 ? "jam" : "ham") : hand.current.kind;
      const down = rollDown(kind);
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
        const next: Kind = Math.random() < 0.5 ? "jam" : "ham";
        hand.current = { kind: next, cooldown: 0.12 };
        setHandKind(next);
      }
      void h;
    },
    [handGeom],
  );

  // load images
  useEffect(() => {
    for (const src of [jamSrc, hamSrc, handSrc, chefSrc, truckSrc, s1Src, s2Src]) {
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
    const el = sceneRef.current!;
    const cv = canvasRef.current!;
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
      const gc = g.getContext("2d")!;
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
    const cv = canvasRef.current!;
    const ctx = cv.getContext("2d")!;
    let raf = 0;
    let last = performance.now();

    const actorBox = (a: Actor) => {
      const { w, h } = size.current;
      const s = depth(a.y);
      if (a.kind === "truck") {
        const bw = w * 0.3 * s;
        return { bw, bh: bw * 0.62, s };
      }
      const bh = h * (a.kind === "chef" ? 0.2 : 0.18) * s;
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

      // hit tests
      for (const a of actors.current) {
        const { bw, bh } = actorBox(a);
        const ax = a.x * w;
        const ay = a.y * h;
        if (gx > ax - bw / 2 && gx < ax + bw / 2 && gy > ay - bh && gy < ay + 4) {
          if (a.kind === "student") {
            a.hitT = 1.2;
            bubbles.current.push({ text: STUDENT_LINES[Math.floor(Math.random() * STUDENT_LINES.length)], x: ax, y: ay - bh, t: 1.3 });
          } else if (a.kind === "chef" && !f.bonus) {
            a.hitT = 1.6;
            bubbles.current.push({ text: CHEF_LINES[Math.floor(Math.random() * CHEF_LINES.length)], x: ax, y: ay - bh, t: 1.6, big: true });
            bursts.current.push({ left: 20, every: 0.06, acc: 0, fromSky: false, around: { x: a.x, y: a.y } });
            flash("+20 TOAST BARRAGE!");
          } else if (a.kind === "truck" && !f.bonus) {
            a.hitT = 2;
            bubbles.current.push({ text: "HONK!! CARGO DOOR!", x: ax, y: ay - bh, t: 2, big: true });
            bursts.current.push({ left: 300, every: 0.008, acc: 0, fromSky: true });
            flash("+300 BULK BREAD DROP!");
          }
          break;
        }
      }
      checkMilestone();
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
        for (const a of actors.current) {
          const panic = a.hitT > 0 ? 2.5 : 1;
          if (a.kind !== "truck" || a.hitT <= 0) a.x += a.vx * dt * panic;
          if (a.x < a.min || a.x > a.max) {
            a.vx *= -1;
            a.x = Math.min(a.max, Math.max(a.min, a.x));
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
      }

      // draw
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      if (ground.current) ctx.drawImage(ground.current, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const sorted = [...actors.current].sort((a, b) => a.y - b.y);
      for (const a of sorted) {
        const im = imgs.current[a.img];
        if (!im?.complete) continue;
        const { bw, bh } = actorBox(a);
        const ax = a.x * w;
        const ay = a.y * h;
        ctx.save();
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.beginPath();
        ctx.ellipse(ax, ay, bw * 0.45, bw * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.translate(ax, ay);
        if (a.hitT > 0) ctx.rotate(Math.sin(now / 40) * 0.12);
        const bob = a.kind === "truck" ? 0 : Math.abs(Math.sin(now / 180 + a.x * 20)) * 3;
        if (a.vx < 0 && a.kind !== "truck") ctx.scale(-1, 1);
        ctx.filter = "drop-shadow(3px 4px 0 rgba(0,0,0,0.35))";
        ctx.drawImage(im, -bw / 2, -bh - bob, bw, bh);
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
      if (hand.current.cooldown <= 0 || holding.current) {
        const tim = imgs.current[hand.current.kind === "jam" ? jamSrc : hamSrc];
        if (tim?.complete && hand.current.cooldown <= 0) {
          ctx.save();
          ctx.translate(g.tx, g.ty);
          ctx.rotate(-0.25);
          ctx.filter = "drop-shadow(4px 8px 6px rgba(0,0,0,0.4))";
          ctx.drawImage(tim, -g.ts / 2, -g.ts / 2, g.ts, g.ts);
          ctx.restore();
        }
      }
      if (himg?.complete) ctx.drawImage(himg, g.hx, g.hy, g.hs, g.hs);

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
    const N = stats.current.jam.n + stats.current.ham.n;
    const crossed = MILESTONES.filter((m) => N >= m && !seen.current.has(m));
    if (!crossed.length || paused.current) return;
    crossed.forEach((m) => seen.current.add(m));
    paused.current = true;
    holding.current = false;
    setAnswer({});
    setMilestone(crossed[crossed.length - 1]);
  }

  function submitMilestone() {
    if (milestone == null) return;
    setJournal((j) => [
      ...j,
      { n: milestone, which: answer.which!, gap: answer.gap!, jam: rate(stats.current.jam), ham: rate(stats.current.ham) },
    ]);
    setMilestone(null);
    paused.current = false;
  }

  // controls
  const onPointerMove = (e: React.PointerEvent) => {
    const r = sceneRef.current!.getBoundingClientRect();
    aim.current = { x: (e.clientX - r.left) / r.width, y: Math.max(0.28, (e.clientY - r.top) / r.height) };
  };
  const startHold = () => {
    if (paused.current) return;
    launch(false);
    holding.current = true;
    holdAcc.current = -0.25;
  };
  const stopHold = () => {
    holding.current = false;
  };
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
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
    stats.current = createStats();
    seen.current.clear();
    flights.current = [];
    bursts.current = [];
    setJournal([]);
    setRevealed(false);
    const g = ground.current;
    g?.getContext("2d")?.clearRect(0, 0, g.width, g.height);
  };
  const hose = () => {
    const g = ground.current;
    g?.getContext("2d")?.clearRect(0, 0, g.width, g.height);
  };

  const s = stats.current;
  const N = s.jam.n + s.ham.n;
  const jr = rate(s.jam);
  const hr = rate(s.ham);
  const lastGap = journal.length ? Math.abs(journal[journal.length - 1].ham - journal[journal.length - 1].jam) : null;

  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink lg:h-screen lg:flex-row">
      {/* Scene */}
      <div className="relative min-h-[60vh] flex-1 overflow-hidden lg:min-h-0">
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

        <div className="pointer-events-none absolute left-4 top-4 flex flex-col gap-2">
          <h1 className="font-display -rotate-2 bg-ink px-3 py-1 text-2xl leading-none text-paper shadow-cut sm:text-3xl">
            MURPHY'S TOAST LAB
          </h1>
          <p className="max-w-xs rotate-1 bg-paper px-2 py-1 text-xs font-semibold shadow-cut">
            Click to drop one. Hold (or hold Space) to keep dropping. Aim with your cursor. Hit the chef or the bread truck for bonuses.
          </p>
        </div>

        <div className="pointer-events-none absolute bottom-4 right-4 rotate-2 bg-paper px-3 py-2 text-sm font-bold shadow-cut">
          In hand:{" "}
          <span className={handKind === "jam" ? "text-jam" : "text-ham"}>{handKind === "jam" ? "JAM TOAST" : "HAM TOAST"}</span>
        </div>

        {banner && (
          <div className="pointer-events-none absolute inset-x-0 top-1/3 flex justify-center">
            <div className="font-display animate-in zoom-in -rotate-3 border-4 border-ink bg-mustard px-6 py-3 text-3xl text-ink shadow-cut sm:text-5xl">
              {banner}
            </div>
          </div>
        )}

        {milestone != null && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-ink/50 p-4">
            <div className="w-full max-w-md -rotate-1 border-4 border-ink bg-paper p-5 shadow-cut">
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
              <button
                disabled={!answer.which || !answer.gap}
                onClick={submitMilestone}
                className="font-display mt-4 w-full border-4 border-ink bg-jam py-2 text-lg text-paper shadow-cut transition hover:-translate-y-0.5 disabled:opacity-40"
              >
                LOG IT & KEEP DROPPING
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stats panel */}
      <aside className="w-full shrink-0 overflow-y-auto border-t-4 border-ink bg-paper p-4 lg:w-[400px] lg:border-l-4 lg:border-t-0">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-xl">Running average</h2>
          <span className="font-display text-sm">N = {N.toLocaleString()}</span>
        </div>
        <p className="text-xs text-ink/70">% of drops landing topping-side DOWN</p>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <StatCard label="Jam toast" tone="jam" pct={jr} n={s.jam.n} down={s.jam.down} />
          <StatCard label="Ham toast" tone="ham" pct={hr} n={s.ham.n} down={s.ham.down} />
        </div>

        <div className="mt-3 border-2 border-ink bg-card p-2">
          <ConvergenceChart stats={s} />
          <div className="flex justify-center gap-4 text-xs font-bold">
            <span className="text-jam">━ Jam</span>
            <span className="text-ham">━ Ham</span>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={hose} className="border-2 border-ink bg-card px-3 py-1 text-xs font-bold shadow-cut-sm hover:bg-mustard/30">
            Hose down courtyard
          </button>
          <button onClick={resetAll} className="border-2 border-ink bg-card px-3 py-1 text-xs font-bold shadow-cut-sm hover:bg-mustard/30">
            New experiment
          </button>
          {N >= 1000 && !revealed && (
            <button onClick={() => setRevealed(true)} className="border-2 border-ink bg-mustard px-3 py-1 text-xs font-bold shadow-cut-sm">
              Reveal true odds
            </button>
          )}
        </div>
        {revealed && (
          <p className="mt-2 border-2 border-ink bg-mustard/20 p-2 text-xs">
            The secret odds: Jam <b>{P_DOWN.jam * 100}%</b>, Ham <b>{P_DOWN.ham * 100}%</b>. Your {N.toLocaleString()} drops estimated{" "}
            {(jr * 100).toFixed(1)}% and {(hr * 100).toFixed(1)}%. Big samples get close!
          </p>
        )}
        {N < 1000 && <p className="mt-2 text-[11px] text-ink/60">Reach N = 1,000 to unlock the true odds.</p>}

        <h3 className="font-display mt-5 text-base">Hypothesis journal</h3>
        {journal.length === 0 ? (
          <p className="text-xs text-ink/60">Checkpoints at N = {MILESTONES.slice(0, 4).join(", ")}…</p>
        ) : (
          <ul className="mt-1 space-y-1 text-xs">
            {journal.map((j) => (
              <li key={j.n} className="border-b border-ink/15 pb-1">
                <b>N={j.n}:</b> guessed <b>{j.which}</b>, gap <b>{j.gap.toLowerCase()}</b> · Jam {(j.jam * 100).toFixed(0)}% / Ham {(j.ham * 100).toFixed(0)}%
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}

function StatCard({ label, tone, pct, n, down }: { label: string; tone: Kind; pct: number; n: number; down: number }) {
  return (
    <div className={`border-2 border-ink p-2 shadow-cut-sm ${tone === "jam" ? "bg-jam/10" : "bg-ham/15"}`}>
      <p className={`text-xs font-bold uppercase ${tone === "jam" ? "text-jam" : "text-ham"}`}>{label}</p>
      <p className="font-display text-3xl leading-none">{n ? (pct * 100).toFixed(1) : "—"}%</p>
      <p className="text-[11px] text-ink/70">
        {down} down / {n} drops
      </p>
    </div>
  );
}

function Q({ label, options, value, onPick }: { label: string; options: string[]; value?: string; onPick: (v: string) => void }) {
  return (
    <div className="mt-3">
      <p className="text-sm font-semibold">{label}</p>
      <div className="mt-1 flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onPick(o)}
            className={`border-2 border-ink px-3 py-1 text-xs font-bold ${value === o ? "bg-ink text-paper" : "bg-card hover:bg-mustard/30"}`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
