import type { ReactNode } from "react";
import murphySrc from "@/assets/comic-murphy.jpg";
import llnSrc from "@/assets/comic-lln.jpg";
import matthewsSrc from "@/assets/comic-matthews.jpg";
import ignobelSrc from "@/assets/comic-ignobel.jpg";

type Panel = { img: string; title: string; bubble: ReactNode; caption: ReactNode };

export const INTRO_PANELS: Panel[] = [
  {
    img: murphySrc,
    title: "LAW #1 · MURPHY'S LAW",
    bubble: "NOOOO! Not the jam side!",
    caption: <>“Anything that can go wrong, will go wrong.” Folk wisdom says dropped toast <b>always</b> lands topping-side down. The universe hates your breakfast.</>,
  },
  {
    img: llnSrc,
    title: "LAW #2 · THE LAW OF LARGE NUMBERS",
    bubble: "One toast tells me nothing. A thousand tell me the truth.",
    caption: <>One drop is pure luck. But the more times you repeat a random event, the closer the <b>average</b> gets to the true probability. Small samples lie; big samples confess.</>,
  },
];

export const OUTRO_PANELS: Panel[] = [
  {
    img: matthewsSrc,
    title: "1995 · THE TUMBLING TOAST",
    bubble: "It's not the butter. It's the table!",
    caption: <>British physicist <b>Robert Matthews</b> published “Tumbling toast, Murphy's Law and the fundamental constants”. Toast sliding off table height only has time for about <b>half a rotation</b> — so it lands butter-side down roughly <b>60%</b> of the time.</>,
  },
  {
    img: ignobelSrc,
    title: "1996 · THE IG NOBEL PRIZE",
    bubble: "Blame the height of humans, not the butter!",
    caption: <>He won the <b>Ig Nobel Prize for Physics</b> — the parody award for research that “makes people laugh, then think”. Tables are as tall as they are because humans are as tall as they are… which depends on the fundamental constants of physics!</>,
  },
];

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
