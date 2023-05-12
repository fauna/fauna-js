import { fql, QueryCheckError } from "../../src";
import { getClient } from "../client";

const client = getClient();

afterAll(() => {
  client.close();
});

describe.each`
  method
  ${"query"}
  ${"paginate"}
`("$method typings", ({ method }: { method: string }) => {
  it("allows customers to use their own types", async () => {
    expect.assertions(1);
    // added in a junk property that is not part of QueryValue
    type MyType = { x: number; t: QueryCheckError };
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
});
