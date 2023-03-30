import { getClient } from "../client";
import { fql } from "../../src/query-builder";
import { ClientClosedError } from "../../src/errors";

describe("Client", () => {
  it("Refuses further rquests after close", async () => {
    expect.assertions(1);
    const client = getClient();
    client.close();
    try {
      await client.query(fql`'nah'`);
    } catch (e) {
      if (e instanceof ClientClosedError) {
        expect(e.message).toEqual(
          "Your client is closed. No further requests can be issued."
        );
      }
    }
  });
});
