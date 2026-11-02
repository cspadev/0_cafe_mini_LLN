/// <reference types="vite/client" />
// Nízkoúrovňové odesílání a příjem zpráv přes window.postMessage.

import {
  PROTOCOL_VERSION,
  type ErrorCode,
  type InitMessage,
  type OutgoingMessage,
} from "./typy";

// Seznam domén hlavní hry, od kterých minihra přijímá zprávy, oddělený čárkou.
// Nastavuje se proměnnou prostředí VITE_ALLOWED_PARENT_ORIGINS (na Vercelu v nastavení projektu).
// Prázdný = přijímá se od kohokoli, kdo minihru vložil (vhodné pro vývoj).
const allowedOrigins: string[] = (import.meta.env["VITE_ALLOWED_PARENT_ORIGINS"] ?? "")
  .split(",")
  .map((s: string) => s.trim())
  .filter(Boolean);

// Doména rodiče zjištěná z první platné zprávy INIT. Odpovědi pak jdou jen na ni.
let parentOrigin: string | null = null;

/** Běží minihra uvnitř iframu? (Jinak je otevřená samostatně, např. při vývoji.) */
export function isEmbedded(): boolean {
  return window.parent !== window;
}

function isAllowedOrigin(origin: string): boolean {
  return allowedOrigins.length === 0 || allowedOrigins.includes(origin);
}

function post(message: OutgoingMessage) {
  if (!isEmbedded()) {
    console.info("[minihra] samostatný režim – zpráva se nikam neodesílá:", message);
    return;
  }
  const target = parentOrigin ?? (allowedOrigins.length === 1 ? (allowedOrigins[0] ?? "*") : "*");
  window.parent.postMessage(message, target);
}

/**
 * Vrátí zprávu INIT, pokud událost je platná zpráva INIT od rodičovského okna.
 * Cokoli jiného (jiné okno, nepovolená doména, jiný typ) vrátí null.
 */
export function readInit(event: MessageEvent): InitMessage | null {
  if (event.source !== window.parent) return null;
  if (!isAllowedOrigin(event.origin)) {
    console.warn("[minihra] ignoruji zprávu z nepovolené domény:", event.origin);
    return null;
  }
  const data = event.data as unknown;
  if (typeof data !== "object" || data === null) return null;
  if ((data as { type?: unknown }).type !== "INIT") return null;

  if (event.origin !== "null") parentOrigin = event.origin;
  return data as InitMessage;
}

/**
 * Kontrola úspěšnosti před odesláním.
 * Vrací null, pokud hodnota není konečné číslo (NaN, Infinity, text…).
 * Hodnoty mimo 0–1 ořízne na hranici a vypíše varování.
 */
export function checkSuccessRate(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  if (value < 0 || value > 1) {
    console.warn(`[minihra] úspěšnost ${value} je mimo 0–1, ořezávám`);
    return Math.min(1, Math.max(0, value));
  }
  return value;
}

export function sendReady() {
  post({ type: "READY", version: PROTOCOL_VERSION });
}

/** Úspěšnost musí být předem zkontrolovaná funkcí checkSuccessRate. */
export function sendFinish(successRate: number, payload?: unknown) {
  post({
    type: "FINISH",
    version: PROTOCOL_VERSION,
    successRate,
    succesRate: successRate,
    ...(payload !== undefined && { payload }),
  });
}

export function sendError(code: ErrorCode, message: string) {
  post({ type: "ERROR", version: PROTOCOL_VERSION, code, message });
}
