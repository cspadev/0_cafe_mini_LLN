// Typy zpráv, které si minihra vyměňuje s hlavní hrou.
// Popis protokolu je v docs/protokol.md – při změně upravte obojí.

export const PROTOCOL_VERSION = 1;

/** Hlavní hra → minihra: zadání. */
export interface InitMessage {
  type: "INIT";
  version?: number;
  /** Obtížnost. Rozsah zatím nedohodnut (viz docs/k-rozhodnuti.md). */
  level?: number;
  /** Obsah zadání – tvar si určuje každá minihra. */
  payload?: unknown;
}

/** Minihra → hlavní hra: „jsem načtená, pošli INIT“. */
export interface ReadyMessage {
  type: "READY";
  version: number;
}

/** Minihra → hlavní hra: výsledek. */
export interface FinishMessage {
  type: "FINISH";
  version: number;
  /** Úspěšnost 0–1. */
  successRate: number;
  /**
   * Stejná hodnota pod původním názvem s překlepem, který používá sorter_demo.
   * Posíláme dočasně obojí, dokud programátor nepotvrdí přejmenování.
   */
  succesRate: number;
  payload?: unknown;
}

export type ErrorCode =
  | "MISSING_PAYLOAD" // minihra payload potřebuje, ale nepřišel
  | "INVALID_PAYLOAD" // payload přišel, ale má špatný tvar
  | "INVALID_RESULT" // minihra se pokusila odeslat neplatnou úspěšnost (chyba minihry)
  | "INTERNAL"; // jiná chyba uvnitř minihry

/** Minihra → hlavní hra: minihru nelze dohrát. */
export interface ErrorMessage {
  type: "ERROR";
  version: number;
  code: ErrorCode;
  /** Popis pro vývojáře (hráči se nezobrazuje). */
  message: string;
}

export type OutgoingMessage = ReadyMessage | FinishMessage | ErrorMessage;

export type ValidationResult<P> =
  | { ok: true; value: P }
  | { ok: false; message: string };

/**
 * Funkce, která ověří payload z INIT.
 * Dostane `undefined`, pokud payload nepřišel – sama rozhodne, jestli to vadí.
 */
export type PayloadValidator<P> = (raw: unknown) => ValidationResult<P>;
