import { Client, endpoints, fql } from "fauna";
import { inspect } from "util";
// if you want to get at the secret stored in FAUNA_SECRET you can use this function;
// the client will also default to using it.
import { getSecret } from "./typescript/utils";

// sanity check secret is set
getSecret();

inspect.defaultOptions.depth = null;

const client = new Client({
  endpoint: endpoints.preview,
});

async function runMyPlayground() {
  console.log(await client.query(fql`"Hello World!"`));
}

runMyPlayground()
.then(_ => console.log("Thank you for trying FQL X!"))
.catch(e => console.error("Encounted error", e));
