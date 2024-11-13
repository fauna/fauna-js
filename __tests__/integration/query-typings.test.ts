import { fql, Page, QueryCheckError, QueryValueObject } from "../../src";
import { getClient } from "../client";

// added in a junk property that is not part of QueryValue
type MyType = { x: number; t: QueryCheckError };

interface IMyTYpe extends QueryValueObject {
  x: number;
  t: QueryCheckError;
}

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

  it("allows customers to use their own interfaces in queries", async () => {
    const query = fql`{ "x": 123 }`;
    const paginatedQuery = fql`[{ "x": 123}].toSet()`;

    if ("query" === method) {
      const result = (await client.query<IMyTYpe>(query)).data;
      expect(result).toEqual({ x: 123 });
    } else {
      expect.assertions(2);
      for await (const page of client.paginate<IMyTYpe>(paginatedQuery)) {
        for (const result of page) {
          expect(result).toEqual({ x: 123 });
        }
      }

      // It is also allowed to provide a query that does not return a page.
      // When this happenes, the driver treats the result as if a page with
      // exactly one item is returned.
      for await (const page of client.paginate<IMyTYpe>(query)) {
        for (const result of page) {
          expect(result).toEqual({ x: 123 });
        }
      }
    }
  });

  it("allows customers to infer their own types in queries from fql statements", async () => {
    const query = fql<MyType>`{ "x": 123 }`;
    const paginatedQuery = fql<Page<MyType>>`[{ "x": 123}].toSet()`;

    if ("query" === method) {
      const result = (await client.query(query)).data;
      expect(result).toEqual({ x: 123 });
    } else {
      expect.assertions(2);
      for await (const page of client.paginate(paginatedQuery)) {
        for (const result of page) {
          expect(result).toEqual({ x: 123 });
        }
      }

      // It is also allowed to provide a query that does not return a page.
      // When this happenes, the driver treats the result as if a page with
      // exactly one item is returned.
      for await (const page of client.paginate(query)) {
        for (const result of page) {
          expect(result).toEqual({ x: 123 });
        }
      }
    }
  });

  it("allows customers to use subtyped queries", async () => {
    const query = fql<string>`"hello"`;

    const result = (await client.query<string | number>(query)).data;
    expect(result).toEqual("hello");

    // And make sure that the opposite is not possible
    const query2 = fql<string | number>`"hello"`;
    // @ts-expect-error Argument of type 'Query<string | number>' is not assignable to parameter of type 'Query<string>'.
    await client.query<string>(query2);
  });
});
