export const LOG_LEVELS = {
  TRACE: "0",
  DEBUG: "1",
  INFO: "2",
  WARN: "3",
  ERROR: "4",
} as const;
export type LogLevel = (typeof LOG_LEVELS)[keyof typeof LOG_LEVELS];

/**
 * Converts the FAUNA_DEBUG environment variable (string) into a LogLevel.
 *   The intended use is to set FAUNA_DEBUG=0|1|2|3|4.
 *
 *   This function will convert null, undefined, empty, or or any non matching
 *   string to a LogLevel of ERROR.
 *
 * @param debug_level - The String value of FAUNA_DEBUG.
 */
export function parseDebugLevel(debug_level: string | undefined): LogLevel {
  switch (debug_level) {
    case "0":
    case "1":
    case "2":
    case "3":
    case "4":
      return debug_level;
    default:
      return LOG_LEVELS.ERROR;
  }
}

export interface LogHandler {
  trace(msg?: string, args?: string[]): void;
  debug(msg?: string, args?: string[]): void;
  info(msg?: string, args?: string[]): void;
  warn(msg?: string, args?: string[]): void;
  error(msg?: string, args?: string[]): void;
}

export class ConsoleLogHandler implements LogHandler {
  readonly #level: LogLevel;
  constructor(level: LogLevel) {
    this.#level = level;
  }

  trace(msg?: string, args?: string[]): void {
    if (this.#level >= LOG_LEVELS.TRACE) {
      console.trace(msg, args);
    }
  }

  debug(msg?: string, args?: string[]): void {
    if (this.#level >= LOG_LEVELS.DEBUG) {
      console.debug(msg, args);
    }
  }

  info(msg?: string, args?: string[]): void {
    if (this.#level >= LOG_LEVELS.INFO) {
      console.info(msg, args);
    }
  }

  warn(msg?: string, args?: string[]): void {
    if (this.#level >= LOG_LEVELS.WARN) {
      console.warn(msg, args);
    }
  }
  error(msg?: string, args?: string[]): void {
    if (this.#level >= LOG_LEVELS.ERROR) {
      console.error(msg, args);
    }
  }
}
