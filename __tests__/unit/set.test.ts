import { EmbeddedSet, Page, SetIterator } from "../../src";
import { getClient } from "../client";

const client = getClient();

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

describe("SetIterator", () => {
  it("can be constructed from a Page", () => {
    const page = new Page({
      data: [1, 2, 3],
      after: "1234",
    });
    new SetIterator<number>(client, page);
  });

  it("can be constructed from an EmbeddedSet", () => {
    const embeddedSet = new EmbeddedSet("1234");
    new SetIterator<number>(client, embeddedSet);
  });

  it("can be constructed with an initial thunk for a T", async () => {
    expect.assertions(1);

    const setIterator = new SetIterator<number>(client, async () => 42);

    for await (const page of setIterator) {
      expect(page).toStrictEqual([42]);
    }
  });

  it("can be constructed with an initial thunk for a Page<T>", async () => {
    expect.assertions(1);

    const setIterator = new SetIterator<number>(
      client,
      async () => new Page({ data: [42] })
    );

    for await (const page of setIterator) {
      expect(page).toStrictEqual([42]);
    }
  });

  it("can be constructed with an initial thunk for an EmbeddedSet", async () => {
    new SetIterator<number>(client, async () => new EmbeddedSet("1234"));
  });

  it("can be flattened", async () => {
    expect.assertions(1);

    const setIterator = new SetIterator<number>(client, async () => 42);

    for await (const item of setIterator.flatten()) {
      expect(item).toStrictEqual(42);
    }
  });

  it("can flatten a Page", async () => {
    expect.assertions(2);

    const setIterator = new SetIterator<number>(
      client,
      async () => new Page({ data: [42, 42] })
    );

    for await (const item of setIterator.flatten()) {
      expect(item).toStrictEqual(42);
    }
  });

  it("throws if data and after are both undefined", () => {
    // @ts-ignore-next-line
    expect(() => new SetIterator<number>(client, {})).toThrow();
  });
});
