export enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
}

/**
 * Converts the FAUNA_DEBUG environment variable (string) into a LogLevel.
 *   The intended use is to set FAUNA_DEBUG=0|1|2|3|4.
 *
 *   This function will convert null, undefined, empty, or or any non matching
 *   string to a LogLevel of ERROR.
 *
 * @param fauna_debug - The String value of FAUNA_DEBUG.
 */
export function parseDebugLevel(fauna_debug: string | undefined): LogLevel {
  switch (fauna_debug) {
    case "0":
      return LogLevel.TRACE;
    case "1":
      return LogLevel.DEBUG;
    case "2":
      return LogLevel.INFO;
    case "3":
      return LogLevel.WARN;
    case "4":
      return LogLevel.ERROR;
    default:
      return LogLevel.ERROR;
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
    if (this.#level >= LogLevel.TRACE) {
      console.trace(msg, args);
    }
  }

  debug(msg?: string, args?: string[]): void {
    if (this.#level >= LogLevel.DEBUG) {
      console.debug(msg, args);
    }
  }

  info(msg?: string, args?: string[]): void {
    if (this.#level >= LogLevel.INFO) {
      console.info(msg, args);
    }
  }

  warn(msg?: string, args?: string[]): void {
    if (this.#level >= LogLevel.WARN) {
      console.warn(msg, args);
    }
  }
  error(msg?: string, args?: string[]): void {
    if (this.#level >= LogLevel.ERROR) {
      console.error(msg, args);
    }
  }
}
