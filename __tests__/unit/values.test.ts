import { FaunaDate, FaunaTime } from "../../src/values";

type TestCase<I, O> = {
  input: I;
  expected: O;
  testCase: string;
};

describe("values", () => {
  it.each`
    input                          | expected                       | testCase
    ${"2023-03-08T00:00:00Z"}      | ${"2023-03-08T00:00:00Z"}      | ${"Z"}
    ${"2023-03-07T16:00:00-08:00"} | ${"2023-03-07T16:00:00-08:00"} | ${"- timezone"}
    ${"2023-03-09T02:00:00+08:00"} | ${"2023-03-09T02:00:00+08:00"} | ${"+ timezone"}
    ${"2023-03-08T00:00:00"}       | ${"2023-03-08T00:00:00"}       | ${"no timezone"}
    ${"2023-03-08"}                | ${"2023-03-08"}                | ${"no time"}
  `(
    "can construct FaunaTime from strings: $testCase",
    async ({ input, expected, testCase }: TestCase<string, string>) => {
      testCase;
      const value = FaunaTime.from(input);
      expect(value).toBeInstanceOf(FaunaTime);
      expect(value.value).toBe(expected);
    }
  );

  it.each`
    input                          | expected        | testCase
    ${"2023-03-08T00:00:00Z"}      | ${"2023-03-08"} | ${"Z"}
    ${"2023-03-07T16:00:00-08:00"} | ${"2023-03-08"} | ${"- timezone"}
    ${"2023-03-09T02:00:00+08:00"} | ${"2023-03-08"} | ${"+ timezone"}
    ${"2023-03-08T00:00:00"}       | ${"2023-03-08"} | ${"no timezone"}
    ${"2023-03-08"}                | ${"2023-03-08"} | ${"no time"}
  `(
    "can construct FaunaDate from strings: $testCase",
    async ({ input, expected, testCase }: TestCase<string, string>) => {
      testCase;
      const value = FaunaDate.from(input);
      expect(value).toBeInstanceOf(FaunaDate);
      expect(value.value).toBe(expected);
    }
  );

  it.each`
    input                                    | expected                                         | testCase
    ${new Date("2023-03-08T00:00:00Z")}      | ${"2023-03-08T00:00:00.000Z"}                    | ${"Z"}
    ${new Date("2023-03-07T16:00:00-08:00")} | ${"2023-03-08T00:00:00.000Z"}                    | ${"- timezone"}
    ${new Date("2023-03-09T02:00:00+08:00")} | ${"2023-03-08T18:00:00.000Z"}                    | ${"+ timezone"}
    ${new Date("2023-03-08T00:00:00")}       | ${new Date("2023-03-08T00:00:00").toISOString()} | ${"no timezone"}
    ${new Date("2023-03-08")}                | ${"2023-03-08T00:00:00.000Z"}                    | ${"no time"}
  `(
    "can construct FaunaTime from Date: $testCase",
    async ({ input, expected, testCase }: TestCase<Date, string>) => {
      testCase;
      const value = FaunaTime.fromDate(input);
      expect(value).toBeInstanceOf(FaunaTime);
      expect(value.value).toBe(expected);
    }
  );

  it.each`
    input                                    | expected                                                      | testCase
    ${new Date("2023-03-08T00:00:00Z")}      | ${"2023-03-08"}                                               | ${"Z"}
    ${new Date("2023-03-07T16:00:00-08:00")} | ${"2023-03-08"}                                               | ${"- timezone"}
    ${new Date("2023-03-09T02:00:00+08:00")} | ${"2023-03-08"}                                               | ${"+ timezone"}
    ${new Date("2023-03-08T00:00:00")}       | ${new Date("2023-03-08T00:00:00").toISOString().slice(0, 10)} | ${"no timezone"}
    ${new Date("2023-03-08")}                | ${"2023-03-08"}                                               | ${"no time"}
  `(
    "can construct FaunaDate from Date: $testCase",
    async ({ input, expected, testCase }: TestCase<Date, string>) => {
      testCase;
      const value = FaunaDate.fromDate(input);
      expect(value).toBeInstanceOf(FaunaDate);
      expect(value.value).toBe(expected);
    }
  );

  it.each`
    input                                          | expected                                | testCase
    ${FaunaTime.from("2023-03-08T00:00:00Z")}      | ${new Date("2023-03-08T00:00:00.000Z")} | ${"Z"}
    ${FaunaTime.from("2023-03-07T16:00:00-08:00")} | ${new Date("2023-03-08T00:00:00.000Z")} | ${"- timezone"}
    ${FaunaTime.from("2023-03-09T02:00:00+08:00")} | ${new Date("2023-03-08T18:00:00.000Z")} | ${"+ timezone"}
    ${FaunaTime.from("2023-03-08T00:00:00")}       | ${new Date("2023-03-08T00:00:00")}      | ${"no timezone"}
    ${FaunaTime.from("2023-03-08")}                | ${new Date("2023-03-08T00:00:00.000Z")} | ${"no time"}
  `(
    "can deconstruct FaunaTime into a Date: $testCase",
    async ({ input, expected, testCase }: TestCase<FaunaTime, Date>) => {
      testCase;
      const date = input.toDate();
      expect(date).toEqual(expected);
    }
  );

  it.each`
    input                                          | expected                                | testCase
    ${FaunaDate.from("2023-03-08T00:00:00Z")}      | ${new Date("2023-03-08T00:00:00.000Z")} | ${"Z"}
    ${FaunaDate.from("2023-03-07T16:00:00-08:00")} | ${new Date("2023-03-08T00:00:00.000Z")} | ${"- timezone"}
    ${FaunaDate.from("2023-03-09T02:00:00+08:00")} | ${new Date("2023-03-08T00:00:00.000Z")} | ${"+ timezone"}
    ${FaunaDate.from("2023-03-08T00:00:00")}       | ${new Date("2023-03-08T00:00:00.000Z")} | ${"no timezone"}
    ${FaunaDate.from("2023-03-08")}                | ${new Date("2023-03-08T00:00:00.000Z")} | ${"no time"}
  `(
    "can deconstruct FaunaDate into a Date: $testCase",
    async ({ input, expected, testCase }: TestCase<FaunaDate, Date>) => {
      testCase;
      const date = input.toDate();
      expect(date).toEqual(expected);
    }
  );
});
