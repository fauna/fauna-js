import { JSONValue } from "../wire-protocol";

export class Page<T extends JSONValue> {
  readonly data: T[];
  readonly after?: string;

  constructor({ data, after }: { data: T[]; after?: string }) {
    this.data = data;
    this.after = after;
  }

  // TODO: implement pagination helpers in this class
}
