import { fql } from "../../src";

describe("fql method producing Querys", () => {
  it("parses with no variables", () => {
    const queryBuilder = fql`'foo'.length`;
    const fragment = queryBuilder.encode();
    expect(fragment).toEqual({ fql: ["'foo'.length"] });
  });

  it("parses with a string variable", () => {
    const str = "foo";
    const queryBuilder = fql`${str}.length`;
    const fragment = queryBuilder.encode();
    expect(fragment).toEqual({
      fql: [{ value: "foo" }, ".length"],
    });
  });

  it("parses with a number variable", () => {
    const num = 8;
    const queryBuilder = fql`'foo'.length == ${num}`;
    const fragment = queryBuilder.encode();
    expect(fragment).toEqual({
      fql: ["'foo'.length == ", { value: { "@int": "8" } }],
    });
  });

  it("parses with a boolean variable", () => {
    const bool = true;
    const queryBuilder = fql`val.enabled == ${bool}`;
    const fragment = queryBuilder.encode();
    expect(fragment).toEqual({
      fql: ["val.enabled == ", { value: true }],
    });
  });

  it("parses with a null variable", () => {
    const queryBuilder = fql`value: ${null}`;
    const fragment = queryBuilder.encode();
    expect(fragment).toEqual({
      fql: ["value: ", { value: null }],
    });
  });

  it("parses with an object variable", () => {
    const obj = { foo: "bar", bar: "baz" };
    const queryBuilder = fql`value: ${obj}`;
    const fragment = queryBuilder.encode();
    expect(fragment).toEqual({
      fql: [
        "value: ",
        { object: { bar: { value: "baz" }, foo: { value: "bar" } } },
      ],
    });
  });

  it("parses with an object variable having a toQuery property", () => {
    const obj = { foo: "bar", bar: "baz", toQuery: "hehe" };
    const queryBuilder = fql`value: ${obj}`;
    const fragment = queryBuilder.encode();
    expect(fragment).toEqual({
      fql: [
        "value: ",
        {
          object: {
            bar: { value: "baz" },
            foo: { value: "bar" },
            toQuery: { value: "hehe" },
          },
        },
      ],
    });
  });

  it("parses with an array variable", () => {
    const arr = [1, 2, 3];
    const queryBuilder = fql`value: ${arr}`;
    const fragment = queryBuilder.encode();
    expect(fragment).toEqual({
      fql: [
        "value: ",
        {
          array: [
            { value: { "@int": "1" } },
            { value: { "@int": "2" } },
            { value: { "@int": "3" } },
          ],
        },
        ,
      ],
    });
  });

  it("parses with multiple variables", () => {
    const str = "bar";
    const num = 17;
    const queryBuilder = fql`${str}.length == ${num + 3}`;
    const fragment = queryBuilder.encode();
    expect(fragment).toEqual({
      fql: [{ value: "bar" }, ".length == ", { value: { "@int": "20" } }],
    });
  });

  it("parses nested expressions", () => {
    const str = "baz";
    const num = 17;
    const innerQuery = fql`Math.add(${num}, 3)`;
    const queryBuilder = fql`${str}.length == ${innerQuery}`;
    const fragment = queryBuilder.encode();
    expect(fragment).toEqual({
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
    const fragment = queryBuilder.encode();
    expect(fragment).toEqual({
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
    const fragment = queryBuilder.encode();
    expect(fragment).toEqual({
      fql: [
        "\n      let name = ",
        { value: "Alice" },
        '\n      "Hello, #{name}"\n    ',
      ],
    });
  });
});
