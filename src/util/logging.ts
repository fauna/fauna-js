export enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
}

/**
 * Converts the FAUNA_DEBUG environment variable (string) into a LogLevel.
 *   The intended use is to set FAUNA_DEBUG=0|1.
 *
 *   This function will convert null, undefined, empty, or or any string
 *   starting with "0" to false.
 *
 * @param fauna_debug - The String value of FAUNA_DEBUG.
 */
export function faunaDebugEnabled(fauna_debug: string | undefined): boolean {
  if (fauna_debug === undefined || fauna_debug === null) {
    return false;
  } else {
    if (fauna_debug.length == 0) {
      return false;
    } else {
      if (fauna_debug.startsWith("0")) {
        return false;
      } else {
        return true;
      }
    }
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
  constructor(private readonly level: LogLevel) {
    if (level === null) {
      this.level = LogLevel.ERROR;
    }
  }

  trace(msg?: string, args?: string[]): void {
    if (this.level >= LogLevel.TRACE) {
      console.trace(msg, args);
    }
  }

  debug(msg?: string, args?: string[]): void {
    if (this.level >= LogLevel.DEBUG) {
      console.debug(msg, args);
    }
  }

  info(msg?: string, args?: string[]): void {
    if (this.level >= LogLevel.INFO) {
      console.info(msg, args);
    }
  }

  warn(msg?: string, args?: string[]): void {
    if (this.level >= LogLevel.WARN) {
      console.warn(msg, args);
    }
  }
  error(msg?: string, args?: string[]): void {
    if (this.level >= LogLevel.ERROR) {
      console.error(msg, args);
    }
  }
}
