const u = require("./build/typescript/utils");
const { Client, endpoints, fql } = require('fauna');
const repl = require('node:repl');

u.getSecret(); // sanity check secret is set

const client = new Client({
  endpoint: endpoints.preview,
});
const r = repl.start('> ');
r.writer.options.depth = null;
Object.defineProperties(
  r.context,
  {
    client: {
      value: client,
      enumerable: true,
    },
    fql: {
      value: fql,
      enumerable: true,
    },
    Client: {
      value: Client,
      enumerable: true,
    },
    endpoints: {
      value: endpoints,
      enumerable: true,
    },
    getSecret: {
      value: u.getSecret,
      enumerable: true,
    }
  }
);

