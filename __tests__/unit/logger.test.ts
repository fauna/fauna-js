import { LOG_LEVELS, parseDebugLevel } from "../../src";

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
