import { ConsoleLogHandler, LOG_LEVELS, parseDebugLevel } from "../../src";
import { LogHandler } from "../../src/util/logging";

describe("logging", () => {
  describe("parseDebugLevel", () => {
    it.each`
      testName                  | input               | result
      ${"'0'"}                  | ${"0"}              | ${"0"}
      ${"'1'"}                  | ${"1"}              | ${"1"}
      ${"'2'"}                  | ${"2"}              | ${"2"}
      ${"'3'"}                  | ${"3"}              | ${"3"}
      ${"'4'"}                  | ${"4"}              | ${"4"}
      ${"'5'"}                  | ${"5"}              | ${"5"}
      ${"'6'"}                  | ${"6"}              | ${"6"}
      ${"LOG_LEVELS.TRACE"}     | ${LOG_LEVELS.TRACE} | ${LOG_LEVELS.TRACE}
      ${"LOG_LEVELS.DEBUG"}     | ${LOG_LEVELS.DEBUG} | ${LOG_LEVELS.DEBUG}
      ${"LOG_LEVELS.INFO"}      | ${LOG_LEVELS.INFO}  | ${LOG_LEVELS.INFO}
      ${"LOG_LEVELS.WARN"}      | ${LOG_LEVELS.WARN}  | ${LOG_LEVELS.WARN}
      ${"LOG_LEVELS.ERROR"}     | ${LOG_LEVELS.ERROR} | ${LOG_LEVELS.ERROR}
      ${"LOG_LEVELS.FATAL"}     | ${LOG_LEVELS.FATAL} | ${LOG_LEVELS.FATAL}
      ${"LOG_LEVELS.OFF"}       | ${LOG_LEVELS.OFF}   | ${LOG_LEVELS.OFF}
      ${"empty"}                | ${""}               | ${"6"}
      ${"null"}                 | ${null}             | ${"6"}
      ${"undefined"}            | ${undefined}        | ${"6"}
      ${"unkown number string"} | ${"42"}             | ${"6"}
      ${"unknown string"}       | ${"asdf"}           | ${"6"}
      ${"number"}               | ${42}               | ${"6"}
    `(
      "correctly parses $testName to log level '$result'",
      ({ input, result }) => {
        expect(parseDebugLevel(input)).toBe(result);
      },
    );
  });
});

describe("levels", () => {
  describe("TRACE log level", () => {
    const logger: LogHandler = new ConsoleLogHandler(LOG_LEVELS.DEBUG);
    it("always log", () => {
      logger.trace("Should log trace");
      logger.debug("Should log debug");
      logger.warn("Should log warnings");
      logger.error("Should log errors");
    });
  });
  describe("DEBUG log level", () => {
    const logger: LogHandler = new ConsoleLogHandler(LOG_LEVELS.DEBUG);
    it("skipped", () => {
      logger.trace("Should not log", "foo");
    });
    it("debug", () => {
      logger.debug("Should log something");
    });
    it("warn", () => {
      logger.warn("Should also log (%s substitution!)", "with");
    });
  });
  describe("ERROR log level", () => {
    const logger: LogHandler = new ConsoleLogHandler(LOG_LEVELS.ERROR);
    it("skipped", () => {
      logger.trace("Should not log", "foo");
      logger.debug("Should not log", "bar");
      logger.warn("Should not log");
    });
    it("logged", () => {
      logger.error("Should log (%s substitution!)", "with");
    });
  });
});

describe("Log messages", () => {
  const logger: LogHandler = new ConsoleLogHandler(LOG_LEVELS.TRACE);
  describe("Log message construction", () => {
    it("trace", () => {
      logger.trace("hello %s world", "foo", "bar"); // hello foo world bar
      logger.trace("hello %s %s world", "foo", "bar"); // hello foo bar world
      logger.trace("hello %s %s %s world", "foo", "bar"); // hello foo bar %s world
    });
    it("debug", () => {
      logger.debug("hello %s world", "foo", "bar"); // hello foo world bar
      logger.debug("hello %s %s world", "foo", "bar"); // hello foo bar world
      logger.debug("hello %s %s %s world", "foo", "bar"); // hello foo bar %s world
    });
    it("info", () => {
      logger.info("hello %s world", "foo", "bar"); // hello foo world bar
      logger.info("hello %s %s world", "foo", "bar"); // hello foo bar world
      logger.info("hello %s %s %s world", "foo", "bar"); // hello foo bar %s world
    });
    it("warn", () => {
      logger.warn("hello %s world", "foo", "bar"); // hello foo world bar
      logger.warn("hello %s %s world", "foo", "bar"); // hello foo bar world
      logger.warn("hello %s %s %s world", "foo", "bar"); // hello foo bar %s world
    });
    it("error", () => {
      logger.error("hello %s world", "foo", "bar"); // hello foo world bar
      logger.error("hello %s %s world", "foo", "bar"); // hello foo bar world
      logger.error("hello %s %s %s world", "foo", "bar"); // hello foo bar %s world
    });
  });
});
