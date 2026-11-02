import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ToastGame } from "@/components/toast/ToastGame";
import { Minihra, type PayloadValidator } from "@/protokol";
import { t } from "@/i18n";

// The host game sends no settings yet: any payload (or none) is accepted and ignored.
const acceptAnyPayload: PayloadValidator<unknown> = (raw) => ({ ok: true, value: raw });

function ToastMinigame() {
  // The server always renders the default language; ?lang= is applied in the browser.
  useEffect(() => {
    document.documentElement.lang = t.htmlLang;
  }, []);

  return (
    <Minihra validatePayload={acceptAnyPayload}>
      {(hra) => (
        <ToastGame
          onFinish={hra.embedded ? (summary) => hra.finish(summary.correctRounds / summary.rounds, summary) : undefined}
        />
      )}
    </Minihra>
  );
}

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: t.meta.title },
      { name: "description", content: t.meta.description },
      { property: "og:title", content: t.meta.ogTitle },
      { property: "og:description", content: t.meta.ogDescription },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ToastMinigame,
});
