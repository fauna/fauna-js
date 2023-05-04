import { TaggedTypeFormat, fql } from "../../src";
import { FQLFragment } from "../../src/wire-protocol";

describe("fql method producing Queries", () => {
  it("parses with no variables", () => {
    const queryBuilder = fql`'foo'.length`;
    const encoded: FQLFragment = TaggedTypeFormat.encode(queryBuilder);

    expect(queryBuilder.toString()).toBe(`'foo'.length`);
    expect(encoded).toEqual({ fql: ["'foo'.length"] });
  });

  it("parses with a string variable", () => {
    const str = "foo";
    const queryBuilder = fql`${str}.length`;
    const encoded: FQLFragment = TaggedTypeFormat.encode(queryBuilder);

    expect(queryBuilder.toString()).toBe(`"foo".length`);
    expect(encoded).toEqual({
      fql: [{ value: "foo" }, ".length"],
    });
  });

  it("parses with a number variable", () => {
    const num = 8;
    const queryBuilder = fql`'foo'.length == ${num}`;
    const encoded: FQLFragment = TaggedTypeFormat.encode(queryBuilder);

    expect(queryBuilder.toString()).toBe(`'foo'.length == 8`);
    expect(encoded).toEqual({
      fql: ["'foo'.length == ", { value: { "@int": "8" } }],
    });
  });

  it("parses with a boolean variable", () => {
    const bool = true;
    const queryBuilder = fql`val.enabled == ${bool}`;
    const encoded: FQLFragment = TaggedTypeFormat.encode(queryBuilder);

    expect(queryBuilder.toString()).toBe(`val.enabled == true`);
    expect(encoded).toEqual({
      fql: ["val.enabled == ", { value: true }],
    });
  });

  it("parses with a null variable", () => {
    const queryBuilder = fql`value: ${null}`;
    const encoded: FQLFragment = TaggedTypeFormat.encode(queryBuilder);

    expect(queryBuilder.toString()).toBe(`value: null`);
    expect(encoded).toEqual({
      fql: ["value: ", { value: null }],
    });
  });

  it("parses with an object variable", () => {
    const obj = { foo: "bar", bar: "baz" };
    const queryBuilder = fql`value: ${obj}`;
    const encoded: FQLFragment = TaggedTypeFormat.encode(queryBuilder);

    expect(queryBuilder.toString()).toBe('value: {"foo":"bar","bar":"baz"}');
    expect(encoded).toEqual({
      fql: ["value: ", { value: { bar: "baz", foo: "bar" } }],
    });
  });

  it("parses with an array variable", () => {
    const arr = [1, 2, 3];
    const queryBuilder = fql`value: ${arr}`;
    const encoded: FQLFragment = TaggedTypeFormat.encode(queryBuilder);

    expect(queryBuilder.toString()).toBe("value: [1,2,3]");
    expect(encoded).toEqual({
      fql: [
        "value: ",
        { value: [{ "@int": "1" }, { "@int": "2" }, { "@int": "3" }] },
      ],
    });
  });

  it("parses with multiple variables", () => {
    const str = "bar";
    const num = 17;
    const queryBuilder = fql`${str}.length == ${num + 3}`;
    const encoded: FQLFragment = TaggedTypeFormat.encode(queryBuilder);

    expect(queryBuilder.toString()).toBe('"bar".length == 20');
    expect(encoded).toEqual({
      fql: [{ value: "bar" }, ".length == ", { value: { "@int": "20" } }],
    });
  });

  it("parses nested expressions", () => {
    const str = "baz";
    const num = 17;
    const innerQuery = fql`Math.add(${num}, 3)`;
    const queryBuilder = fql`${str}.length == ${innerQuery}`;
    const encoded: FQLFragment = TaggedTypeFormat.encode(queryBuilder);

    expect(queryBuilder.toString()).toBe('"baz".length == Math.add(17, 3)');
    expect(encoded).toEqual({
      fql: [
        { value: "baz" },
        ".length == ",
        { fql: ["Math.add(", { value: { "@int": "17" } }, ", 3)"] },
      ],
    });
  });

  it("parses deep nested expressions", () => {
    const str = "baz";
    const otherStr = "bar";
    const num = 17;
    const otherNum = 3;
    const deepFirst = fql`(${str} + ${otherStr})`;
    const deeperBuilder = fql`Math.add(${num}, 3)`;
    const innerQuery = fql`Math.add(${deeperBuilder}, ${otherNum})`;
    const queryBuilder = fql`${deepFirst}.length == ${innerQuery}`;
    const encoded: FQLFragment = TaggedTypeFormat.encode(queryBuilder);

    expect(queryBuilder.toString()).toBe(
      '("baz" + "bar").length == Math.add(Math.add(17, 3), 3)'
    );
    expect(encoded).toEqual({
      fql: [
        { fql: ["(", { value: "baz" }, " + ", { value: "bar" }, ")"] },
        ".length == ",
        {
          fql: [
            "Math.add(",
            { fql: ["Math.add(", { value: { "@int": "17" } }, ", 3)"] },
            ", ",
            { value: { "@int": "3" } },
            ")",
          ],
        },
      ],
    });
  });

  it("parses with FQL string interpolation", async () => {
    const codeName = "Alice";
    const queryBuilder = fql`
      let name = ${codeName}
      "Hello, #{name}"
    `;
    const encoded: FQLFragment = TaggedTypeFormat.encode(queryBuilder);

    expect(queryBuilder.toString()).toBe(`
      let name = "Alice"
      "Hello, #{name}"
    `);
    expect(encoded).toEqual({
      fql: [
        "\n      let name = ",
        { value: "Alice" },
        '\n      "Hello, #{name}"\n    ',
      ],
    });
  });
});
