export const LOG_LEVELS = {
  TRACE: "0",
  DEBUG: "1",
  INFO: "2",
  WARN: "3",
  ERROR: "4",
  FATAL: "5",
  OFF: "6",
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
    case LOG_LEVELS.TRACE:
    case LOG_LEVELS.DEBUG:
    case LOG_LEVELS.INFO:
    case LOG_LEVELS.WARN:
    case LOG_LEVELS.ERROR:
    case LOG_LEVELS.FATAL:
      return debug_level;
    default:
      return LOG_LEVELS.OFF;
  }
}

export interface LogHandler {
  trace(msg?: string, args?: string[]): void;
  debug(msg?: string, args?: string[]): void;
  info(msg?: string, args?: string[]): void;
  warn(msg?: string, args?: string[]): void;
  error(msg?: string, args?: string[]): void;
  fatal(msg?: string, args?: string[]): void;
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

  fatal(msg?: string, args?: string[]): void {
    if (this.#level >= LOG_LEVELS.FATAL) {
      console.error(msg, args);
    }
  }
}
