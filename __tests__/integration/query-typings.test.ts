import { fql, QueryCheckError } from "../../src";
import { getClient } from "../client";

// added in a junk property that is not part of QueryValue
type MyType = { x: number; t: QueryCheckError };

const client = getClient();

afterAll(() => {
  client.close();
});

describe.each`
  method
  ${"query"}
  ${"paginate"}
`("$method typings", ({ method }: { method: string }) => {
  it("allows customers to use their own types in queries", async () => {
    expect.assertions(1);
    if ("query" === method) {
      const result = (await client.query<MyType>(fql`{ "x": 123}`)).data;
      expect(result).toEqual({ x: 123 });
    } else {
      for await (const page of client.paginate<MyType>(fql`{ "x": 123}`)) {
        for (const result of page) {
          expect(result).toEqual({ x: 123 });
        }
      }
    }
  });

  it("allows customers to infer their own types in queries from fql statements", async () => {
    // This is a noop function that is only used to validate the inferred type of the query
    // It will fail at build time if types are not inferred correctly.
    const noopToValidateInferredType = (value: MyType) => {};

    const query = fql<MyType>`{ "x": 123 }`;
    const q2 = fql`{ "x": ${query} }`;

    expect.assertions(1);
    if ("query" === method) {
      const result = (await client.query(query)).data;
      noopToValidateInferredType(result);
      expect(result).toEqual({ x: 123 });
    } else {
      for await (const page of client.paginate<MyType>(fql`{ "x": 123}`)) {
        for (const result of page) {
          noopToValidateInferredType(result);
          expect(result).toEqual({ x: 123 });
        }
      }
    }
    Promise.resolve();
  });
});
