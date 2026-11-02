import type { Stats } from "@/lib/toast-sim";
import jamSrc from "@/assets/toast-jam.png";
import hamSrc from "@/assets/toast-ham.png";
import { TOAST_CONFIG } from "@/lib/toast-config";
import { t, formatPercent } from "@/i18n";

const W = 360;
const PAD = { l: 34, r: 10, t: 10, b: 26 };

export function ConvergenceChart({ stats, compact = false }: { stats: Stats; compact?: boolean }) {
  const H = compact ? 110 : 210;
  const wild = TOAST_CONFIG.chartWildZoneN;
  const nMax = Math.max(wild, stats.jam.n, stats.ham.n);
  const maxPow = Math.ceil(Math.log10(nMax));
  const xMaxLog = Math.max(maxPow, 1.3);
  const x = (n: number) => PAD.l + (Math.log10(n) / xMaxLog) * (W - PAD.l - PAD.r);
  const y = (p: number) => PAD.t + (1 - p) * (H - PAD.t - PAD.b);
  const path = (pts: [number, number][]) =>
    pts.map(([n, p], i) => `${i ? "L" : "M"}${x(n).toFixed(1)},${y(p).toFixed(1)}`).join(" ");
  const ticks: number[] = [];
  for (let k = 0; k <= Math.floor(xMaxLog); k++) ticks.push(10 ** k);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={compact ? "h-[96px] w-full" : "w-full"} role="img" aria-label={t.chart.label}>
      <rect x={x(1)} y={PAD.t} width={x(wild) - x(1)} height={H - PAD.t - PAD.b} className="fill-mustard/25" />
      <text x={x(1) + 4} y={PAD.t + 12} className="fill-ink/60 text-[9px] font-bold uppercase tracking-wider">
        {t.chart.wildZone(wild)}
      </text>
      {[0, 0.25, 0.5, 0.75, 1].map((p) => (
        <g key={p}>
          <line x1={PAD.l} x2={W - PAD.r} y1={y(p)} y2={y(p)} className="stroke-ink/15" strokeDasharray={p === 0.5 ? "4 3" : undefined} />
          <text x={PAD.l - 4} y={y(p) + 3} textAnchor="end" className="fill-ink/70 text-[9px]">
            {formatPercent(p)}
          </text>
        </g>
      ))}
      {ticks.map((t) => (
        <text key={t} x={x(t)} y={H - 8} textAnchor="middle" className="fill-ink/70 text-[9px]">
          {t >= 1000 ? `${t / 1000}k` : t}
        </text>
      ))}
      <text x={W - PAD.r} y={PAD.t + 12} textAnchor="end" className="fill-ink/50 text-[8px]">
        {t.chart.axis}
      </text>
      <path d={path(stats.ham.series)} className="fill-none stroke-plot-ham" strokeWidth={2.5} strokeDasharray="6 3" strokeLinejoin="round" />
      <path d={path(stats.jam.series)} className="fill-none stroke-jam" strokeWidth={2.5} strokeLinejoin="round" />
      {(["jam", "ham"] as const).map((kind) => {
        const point = stats[kind].series.at(-1);
        if (!point) return null;
        return <image key={kind} href={kind === "jam" ? jamSrc : hamSrc} x={Math.min(W - 25, x(point[0]) - 10)} y={y(point[1]) - 10} width={20} height={20} />;
      })}
    </svg>
  );
}
