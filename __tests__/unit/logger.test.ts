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
      ${"LOG_LEVELS.TRACE"}     | ${LOG_LEVELS.TRACE} | ${LOG_LEVELS.TRACE}
      ${"LOG_LEVELS.DEBUG"}     | ${LOG_LEVELS.DEBUG} | ${LOG_LEVELS.DEBUG}
      ${"LOG_LEVELS.INFO"}      | ${LOG_LEVELS.INFO}  | ${LOG_LEVELS.INFO}
      ${"LOG_LEVELS.WARN"}      | ${LOG_LEVELS.WARN}  | ${LOG_LEVELS.WARN}
      ${"LOG_LEVELS.ERROR"}     | ${LOG_LEVELS.ERROR} | ${LOG_LEVELS.ERROR}
      ${"empty"}                | ${""}               | ${"4"}
      ${"null"}                 | ${null}             | ${"4"}
      ${"undefined"}            | ${undefined}        | ${"4"}
      ${"unkown number string"} | ${"42"}             | ${"4"}
      ${"unknown string"}       | ${"asdf"}           | ${"4"}
      ${"number"}               | ${42}               | ${"4"}
    `(
      "correctly parses input '$input' to log level '$result'",
      ({ input, result }) => {
        expect(parseDebugLevel(input)).toBe(result);
      },
    );
  });
});
