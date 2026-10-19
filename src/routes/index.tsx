import { createFileRoute } from "@tanstack/react-router";
import { ToastGame } from "@/components/toast/ToastGame";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Murphy's Toast Lab — Law of Large Numbers Game" },
      { name: "description", content: "Drop jam and ham toast off a school balcony and watch running averages converge: a hands-on Law of Large Numbers lesson." },
      { property: "og:title", content: "Murphy's Toast Lab" },
      { property: "og:description", content: "Drop toast, splat the courtyard, and discover the Law of Large Numbers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ToastGame,
});
