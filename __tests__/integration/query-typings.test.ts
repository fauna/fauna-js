import { fql, Page, QueryCheckError } from "../../src";
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
    const query = fql`{ "x": 123 }`;
    const paginatedQuery = fql`[{ "x": 123}].toSet()`;

    if ("query" === method) {
      expect.assertions(1);
      const result = (await client.query<MyType>(query)).data;
      expect(result).toEqual({ x: 123 });
    } else {
      expect.assertions(2);
      for await (const page of client.paginate<MyType>(paginatedQuery)) {
        for (const result of page) {
          expect(result).toEqual({ x: 123 });
        }
      }

      // It is also allowed to provide a query that does not return a page.
      // When this happenes, the driver treats the result as if a page with
      // exactly one item is returned.
      for await (const page of client.paginate<MyType>(query)) {
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
    const paginatedQuery = fql<Page<MyType>>`[{ "x": 123}].toSet()`;

    if ("query" === method) {
      expect.assertions(1);
      const result = (await client.query(query)).data;
      noopToValidateInferredType(result);
      expect(result).toEqual({ x: 123 });
    } else {
      expect.assertions(2);
      for await (const page of client.paginate(paginatedQuery)) {
        for (const result of page) {
          noopToValidateInferredType(result);
          expect(result).toEqual({ x: 123 });
        }
      }

      // It is also allowed to provide a query that does not return a page.
      // When this happenes, the driver treats the result as if a page with
      // exactly one item is returned.
      for await (const page of client.paginate(query)) {
        for (const result of page) {
          noopToValidateInferredType(result);
          expect(result).toEqual({ x: 123 });
        }
      }
    }
    Promise.resolve();
  });
});
