import { Set } from "../../src/values";

describe("Set", () => {
  it("can be constructed directly", () => {
    const set = new Set<number>({ data: [1, 2, 3], after: "1234" });
    expect(set.data).toStrictEqual([1, 2, 3]);
    expect(set.after).toBe("1234");
  });
});
