// Obal každé minihry: postará se o komunikaci s hlavní hrou, kontrolu vstupu i výstupu
// a o obrazovky „načítám“, „chyba“ a „odesláno“. Samotná hra dostane jen hotová data.
//
// Použití:
//   <Minihra validatePayload={overPayload}>
//     {(hra) => <MojeHra level={hra.level} payload={hra.payload} onKonec={hra.finish} />}
//   </Minihra>

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  checkSuccessRate,
  isEmbedded,
  readInit,
  sendError,
  sendFinish,
  sendReady,
} from "./komunikace";
import { PROTOCOL_VERSION, type InitMessage, type PayloadValidator } from "./typy";
import "./minihra.css";

export interface GameApi<P> {
  /** Obtížnost z hlavní hry, nebo undefined, pokud nepřišla. */
  level?: number | undefined;
  /** Ověřený payload. */
  payload: P;
  /** true = běží v iframu hlavní hry, false = otevřeno samostatně. */
  embedded: boolean;
  /** Ukončí minihru a odešle výsledek. successRate musí být 0–1. */
  finish: (successRate: number, payload?: unknown) => void;
  /** Ukončí minihru chybou (hra nemůže pokračovat). */
  fail: (message: string) => void;
}

export interface MinihraProps<P> {
  validatePayload: PayloadValidator<P>;
  /** Použije se, když INIT žádný payload neobsahuje. */
  defaultPayload?: P;
  children: (game: GameApi<P>) => ReactNode;
}

type State<P> =
  | { status: "waiting" }
  | { status: "running"; level?: number | undefined; payload: P; round: number }
  | { status: "finished" }
  | { status: "error"; message: string };

// READY se posílá jen jednou za načtení stránky (React ve vývoji spouští efekty dvakrát).
let readySent = false;

/** Parametry pro samostatný režim: ?level=2&payload={"a":1} */
function initFromUrl(): InitMessage {
  const params = new URLSearchParams(window.location.search);
  const init: InitMessage = { type: "INIT" };
  const level = params.get("level");
  if (level !== null) init.level = Number(level);
  const payload = params.get("payload");
  if (payload !== null) {
    try {
      init.payload = JSON.parse(payload);
    } catch {
      init.payload = payload;
    }
  }
  return init;
}

export function Minihra<P>({ validatePayload, defaultPayload, children }: MinihraProps<P>) {
  const [state, setState] = useState<State<P>>({ status: "waiting" });

  // Aktuální verze funkcí/hodnot bez nutnosti znovu registrovat posluchače.
  const options = useRef({ validatePayload, defaultPayload });
  options.current = { validatePayload, defaultPayload };
  const round = useRef(0);

  useEffect(() => {
    const start = (init: InitMessage) => {
      const { validatePayload, defaultPayload } = options.current;

      if (init.version !== undefined && init.version > PROTOCOL_VERSION) {
        console.warn(
          `[minihra] INIT má verzi protokolu ${init.version}, minihra umí ${PROTOCOL_VERSION}`,
        );
      }

      const raw = init.payload === undefined ? defaultPayload : init.payload;
      const result = validatePayload(raw);
      if (result.ok === false) {
        const code = raw === undefined ? "MISSING_PAYLOAD" : "INVALID_PAYLOAD";
        sendError(code, result.message);
        setState({ status: "error", message: result.message });
        return;
      }

      let level: number | undefined;
      if (typeof init.level === "number" && Number.isFinite(init.level)) {
        level = init.level;
      } else if (init.level !== undefined) {
        console.warn("[minihra] level není číslo, ignoruji:", init.level);
      }

      // Nový INIT = nové kolo od začátku (hlavní hra může minihru spustit znovu).
      round.current += 1;
      setState({ status: "running", level, payload: result.value, round: round.current });
    };

    if (!isEmbedded()) {
      start(initFromUrl());
      return;
    }

    const listener = (event: MessageEvent) => {
      const init = readInit(event);
      if (init) start(init);
    };
    window.addEventListener("message", listener);

    if (!readySent) {
      readySent = true;
      sendReady();
    }

    return () => window.removeEventListener("message", listener);
  }, []);

  if (state.status === "waiting") {
    return <div className="minihra-screen">Načítám…</div>;
  }

  if (state.status === "error") {
    return (
      <div className="minihra-screen">
        <p>V minihře nastala chyba.</p>
        <p className="minihra-detail">{state.message}</p>
      </div>
    );
  }

  if (state.status === "finished") {
    return <div className="minihra-screen">Výsledek odeslán.</div>;
  }

  const game: GameApi<P> = {
    level: state.level,
    payload: state.payload,
    embedded: isEmbedded(),
    finish: (successRate, payload) => {
      const checked = checkSuccessRate(successRate);
      if (checked === null) {
        const message = `Neplatná úspěšnost: ${String(successRate)}`;
        sendError("INVALID_RESULT", message);
        setState({ status: "error", message });
        return;
      }
      sendFinish(checked, payload);
      setState({ status: "finished" });
    },
    fail: (message) => {
      sendError("INTERNAL", message);
      setState({ status: "error", message });
    },
  };

  // key zajistí, že při novém INIT začne hra s čistým stavem.
  return <div key={state.round}>{children(game)}</div>;
}
