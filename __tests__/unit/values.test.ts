import { DateStub, TimeStub } from "../../src/values";

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
    "can construct TimeStub from strings: $testCase",
    async ({ input, expected, testCase }: TestCase<string, string>) => {
      testCase;
      const value = TimeStub.from(input);
      expect(value).toBeInstanceOf(TimeStub);
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
    "can construct DateStub from strings: $testCase",
    async ({ input, expected, testCase }: TestCase<string, string>) => {
      testCase;
      const value = DateStub.from(input);
      expect(value).toBeInstanceOf(DateStub);
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
    "can construct TimeStub from Date: $testCase",
    async ({ input, expected, testCase }: TestCase<Date, string>) => {
      testCase;
      const value = TimeStub.fromDate(input);
      expect(value).toBeInstanceOf(TimeStub);
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
    "can construct DateStub from Date: $testCase",
    async ({ input, expected, testCase }: TestCase<Date, string>) => {
      testCase;
      const value = DateStub.fromDate(input);
      expect(value).toBeInstanceOf(DateStub);
      expect(value.value).toBe(expected);
    }
  );

  it.each`
    input                                         | expected                                | testCase
    ${TimeStub.from("2023-03-08T00:00:00Z")}      | ${new Date("2023-03-08T00:00:00.000Z")} | ${"Z"}
    ${TimeStub.from("2023-03-07T16:00:00-08:00")} | ${new Date("2023-03-08T00:00:00.000Z")} | ${"- timezone"}
    ${TimeStub.from("2023-03-09T02:00:00+08:00")} | ${new Date("2023-03-08T18:00:00.000Z")} | ${"+ timezone"}
    ${TimeStub.from("2023-03-08T00:00:00")}       | ${new Date("2023-03-08T00:00:00")}      | ${"no timezone"}
    ${TimeStub.from("2023-03-08")}                | ${new Date("2023-03-08T00:00:00.000Z")} | ${"no time"}
  `(
    "can deconstruct TimeStub into a Date: $testCase",
    async ({ input, expected, testCase }: TestCase<TimeStub, Date>) => {
      testCase;
      const date = input.toDate();
      expect(date).toEqual(expected);
    }
  );

  it.each`
    input                                         | expected                                | testCase
    ${DateStub.from("2023-03-08T00:00:00Z")}      | ${new Date("2023-03-08T00:00:00.000Z")} | ${"Z"}
    ${DateStub.from("2023-03-07T16:00:00-08:00")} | ${new Date("2023-03-08T00:00:00.000Z")} | ${"- timezone"}
    ${DateStub.from("2023-03-09T02:00:00+08:00")} | ${new Date("2023-03-08T00:00:00.000Z")} | ${"+ timezone"}
    ${DateStub.from("2023-03-08T00:00:00")}       | ${new Date("2023-03-08T00:00:00.000Z")} | ${"no timezone"}
    ${DateStub.from("2023-03-08")}                | ${new Date("2023-03-08T00:00:00.000Z")} | ${"no time"}
  `(
    "can deconstruct DateStub into a Date: $testCase",
    async ({ input, expected, testCase }: TestCase<DateStub, Date>) => {
      testCase;
      const date = input.toDate();
      expect(date).toEqual(expected);
    }
  );
});
