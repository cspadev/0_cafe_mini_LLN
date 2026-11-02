import type { ReactNode } from "react";
import murphySrc from "@/assets/comic-murphy.jpg";
import llnSrc from "@/assets/comic-lln.jpg";
import matthewsSrc from "@/assets/comic-matthews.jpg";
import ignobelSrc from "@/assets/comic-ignobel.jpg";

import { t } from "@/i18n";

type Panel = { img: string; title: string; bubble: ReactNode; caption: ReactNode };

export const INTRO_PANELS: Panel[] = [murphySrc, llnSrc].map((img, i) => ({ img, ...t.comics.intro[i]! }));
export const OUTRO_PANELS: Panel[] = [matthewsSrc, ignobelSrc].map((img, i) => ({ img, ...t.comics.outro[i]! }));

export function ComicStrip({ panels }: { panels: Panel[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {panels.map((p, i) => (
        <figure key={p.title} className={`border-4 border-ink bg-card shadow-cut ${i % 2 ? "rotate-1" : "-rotate-1"}`}>
          <div className="relative">
            <img src={p.img} alt="" width={1024} height={768} loading="lazy" className="block aspect-[4/3] w-full object-cover" />
            <span className="font-display absolute left-2 top-2 bg-mustard px-2 py-0.5 text-[11px] text-ink">{p.title}</span>
            <span className="absolute bottom-2 right-2 max-w-[70%] rounded-2xl border-2 border-ink bg-paper px-3 py-1.5 text-xs font-bold text-ink">{p.bubble}</span>
          </div>
          <figcaption className="p-3 text-sm leading-snug">{p.caption}</figcaption>
        </figure>
      ))}
    </div>
  );
}
