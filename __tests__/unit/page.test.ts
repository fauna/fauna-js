import { Page } from "../../src";

describe("Page", () => {
  it("can be constructed directly", () => {
    const set = new Page<number>({ data: [1, 2, 3], after: "1234" });
    expect(set.data).toStrictEqual([1, 2, 3]);
    expect(set.after).toBe("1234");
  });

  it("after is optional", () => {
    const set = new Page<number>({ data: [1, 2, 3] });
    expect(set.data).toStrictEqual([1, 2, 3]);
    expect(set.after).toBeUndefined();
  });

  it("data is optional if after is provided", () => {
    const set = new Page<number>({ after: "1234" });
    expect(set.data).toBeUndefined;
    expect(set.after).toBe("1234");
  });

  it("throws if data and after are both undefined", () => {
    // @ts-ignore-next-line
    expect(() => new Page<number>({})).toThrow();
  });
});
