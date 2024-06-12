import { Client, fql } from "../../src";
import { getClient } from "../client";

const rootClient = getClient();
const clients = new Array<Client>();
const limitedDbName = process.env["QUERY_LIMITS_DB"] || "";
const collectionName = process.env["QUERY_LIMITS_COLL"] || "";
const maybeDescribe =
  process.env["QUERY_LIMITS_DB"] && process.env["QUERY_LIMITS_COLL"]
    ? describe
    : describe.skip;

beforeAll(async () => {
  // Create Key for test database and create clients with the secret
  let secret = await rootClient
    .query<{ secret: string }>(
      fql`
    if (Database.byName(${limitedDbName}).exists()) {
      Key.create({ role: "admin", database: ${limitedDbName} }) { secret }
    } else {
      abort("Database not found.")
    }`,
    )
    .then((res) => res.data.secret)
    .catch((err) => {
      console.log(err);
      throw err;
    });

  for (let i = 0; i < 5; i++) {
    clients.push(getClient({ secret: secret, max_attempts: 30 }));
  }
});

afterAll(() => {
  rootClient.close();
  clients.forEach((x) => x.close());
});

maybeDescribe("Query with limits enabled", () => {
  it("succeeds on retry after getting throttled", async () => {
    expect.assertions(1);

    let throttled = false;
    await Promise.all(
      clients.map((client) => {
        // Target DB needs read_ops limit of 100; call .paginate(50) several times
        // simultaneously to get throttled, all calls should succeed on client retry
        return client
          .query(fql`${fql([collectionName])}.all().paginate(50)`)
          .then((res) => {
            if (res.stats?.attempts && res.stats.attempts > 1) {
              throttled = true;
            }
          })
          .catch((err) => {
            console.log(err);
            throw err;
          });
      }),
    );

    expect(throttled).toBeTruthy();
  }, 20000);
});
