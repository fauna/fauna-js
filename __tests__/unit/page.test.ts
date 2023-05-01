import { EmbeddedSet, Page } from "../../src";

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
});

describe("Embedded Set", () => {
  it("can be constructed directly", () => {
    const set = new EmbeddedSet("1234");
    expect(set.after).toBe("1234");
  });
});
