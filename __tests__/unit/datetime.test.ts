import { DateStub, TimeStub } from "../../src";

type TestCase<I, O> = {
  input: I;
  expected: O;
  testCase: string;
};

describe("values", () => {
  it.each`
    input                          | expected                       | testCase
    ${"2023-03-08T00:00:00Z"}      | ${"2023-03-08T00:00:00Z"}      | ${"Z"}
    ${"2023-03-07T16:00:00-08:00"} | ${"2023-03-07T16:00:00-08:00"} | ${"- HH:MM"}
    ${"2023-03-07T16:00:00-0800"}  | ${"2023-03-07T16:00:00-0800"}  | ${"- HHMM"}
    ${"2023-03-09T02:00:00+08:00"} | ${"2023-03-09T02:00:00+08:00"} | ${"+ HH:MM"}
    ${"2023-03-09T02:00:00+0800"}  | ${"2023-03-09T02:00:00+0800"}  | ${"+ HHMM"}
    ${"+10000-01-01T00:00:00Z"}    | ${"+10000-01-01T00:00:00Z"}    | ${"+yyyyy"}
    ${"-6000-01-01T00:00:00Z"}     | ${"-6000-01-01T00:00:00Z"}     | ${"-yyyy"}
  `(
    "can construct TimeStub from strings: $testCase",
    async ({ input, expected, testCase }: TestCase<string, string>) => {
      testCase;
      const value = TimeStub.from(input);
      expect(value).toBeInstanceOf(TimeStub);
      expect(value.isoString).toBe(expected);
    }
  );

  it.each`
    input           | expected        | testCase
    ${"2023-03-08"} | ${"2023-03-08"} | ${"some date"}
    ${"2004-02-29"} | ${"2004-02-29"} | ${"leap year"}
  `(
    "can construct DateStub from strings: $testCase",
    async ({ input, expected, testCase }: TestCase<string, string>) => {
      testCase;
      const value = DateStub.from(input);
      expect(value).toBeInstanceOf(DateStub);
      expect(value.dateString).toBe(expected);
    }
  );

  it.each`
    input                          | expected                                         | testCase
    ${"2023-03-08T00:00:00Z"}      | ${"2023-03-08T00:00:00.000Z"}                    | ${"Z"}
    ${"2023-03-07T16:00:00-08:00"} | ${"2023-03-08T00:00:00.000Z"}                    | ${"- HH:MM"}
    ${"2023-03-09T02:00:00+08:00"} | ${"2023-03-08T18:00:00.000Z"}                    | ${"+ HH:MM"}
    ${"2023-03-08T00:00:00"}       | ${new Date("2023-03-08T00:00:00").toISOString()} | ${"no timezone"}
    ${"2023-03-08"}                | ${"2023-03-08T00:00:00.000Z"}                    | ${"no time"}
  `(
    "can construct TimeStub from Date: $testCase",
    async ({ input, expected, testCase }: TestCase<string, string>) => {
      testCase;
      const value = TimeStub.fromDate(new Date(input));
      expect(value).toBeInstanceOf(TimeStub);
      expect(value.isoString).toBe(expected);
    }
  );

  it.each`
    input                          | expected                                                      | testCase
    ${"2023-03-08T00:00:00Z"}      | ${"2023-03-08"}                                               | ${"Z"}
    ${"2023-03-07T16:00:00-08:00"} | ${"2023-03-08"}                                               | ${"- HH:MM"}
    ${"2023-03-09T02:00:00+08:00"} | ${"2023-03-08"}                                               | ${"+ HH:MM"}
    ${"2023-03-08T00:00:00"}       | ${new Date("2023-03-08T00:00:00").toISOString().slice(0, 10)} | ${"no timezone"}
    ${"2023-03-08"}                | ${"2023-03-08"}                                               | ${"no time"}
  `(
    "can construct DateStub from Date: $testCase",
    async ({ input, expected, testCase }: TestCase<string, string>) => {
      testCase;
      const value = DateStub.fromDate(new Date(input));
      expect(value).toBeInstanceOf(DateStub);
      expect(value.dateString).toBe(expected);
    }
  );

  it.each`
    input                          | expected                       | testCase
    ${"2023-03-08T00:00:00Z"}      | ${"2023-03-08T00:00:00Z"}      | ${"Z"}
    ${"2023-03-07T16:00:00-08:00"} | ${"2023-03-07T16:00:00-08:00"} | ${"- HH:MM"}
    ${"2023-03-07T16:00:00-0800"}  | ${"2023-03-07T16:00:00-0800"}  | ${"- HHMM"}
    ${"2023-03-09T02:00:00+08:00"} | ${"2023-03-09T02:00:00+08:00"} | ${"+ HH:MM"}
    ${"2023-03-09T02:00:00+0800"}  | ${"2023-03-09T02:00:00+0800"}  | ${"+ HHMM"}
    ${"+010000-01-01T00:00:00Z"}   | ${"+010000-01-01T00:00:00Z"}   | ${"+yyyyy"}
    ${"-006000-01-01T00:00:00Z"}   | ${"-006000-01-01T00:00:00Z"}   | ${"-yyyy"}
  `(
    "can deconstruct TimeStub into a Date: $testCase",
    async ({ input, expected, testCase }: TestCase<string, string>) => {
      testCase;
      const timeStub = TimeStub.from(input);
      const date = timeStub.toDate();
      expect(date).toEqual(new Date(expected));
    }
  );

  it.each`
    input           | expected        | testCase
    ${"2023-03-08"} | ${"2023-03-08"} | ${"some date"}
    ${"2004-02-29"} | ${"2004-02-29"} | ${"leap year"}
  `(
    "can deconstruct DateStub into a Date: $testCase",
    async ({ input, expected, testCase }: TestCase<string, string>) => {
      testCase;
      const dateStub = DateStub.from(input);
      const date = dateStub.toDate();
      expect(date).toEqual(new Date(expected));
    }
  );
});
