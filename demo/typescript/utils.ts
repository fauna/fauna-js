import { env } from "process";

export function getSecret(): string {
  const secret = env["FAUNA_SECRET"];
  if (secret === undefined) {
    throw new Error("You must specifiy a FAUNA_SECRET env var to do these exercises - \
export one to your environment or pass one in as you run a command");
  }
  return secret;
}

export type PartialCustomer = {
  name: string;
  city: string;
};
