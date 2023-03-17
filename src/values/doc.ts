import { JSONObject } from "../wire-protocol";
import { TimeStub } from "./date-time";

/**
 * A Reference to a Document with an ID. The Document may or may not exists.
 * References to Keys, Tokens, and Documents in user-defined Collections are
 * decoded into a {@link DocumentRef}.
 *
 * @example
 * ```javascript
 *  const thingRef = await client.query(fql`
 *    Thing("101")
 *  `);
 *
 *  const id = thingRef.id
 * ```
 */
export class DocumentRef {
  readonly coll: Mod;
  readonly id: string;

  constructor({ coll, id }: { coll: Mod | string; id: string }) {
    this.id = id;

    if (typeof coll === "string") {
      this.coll = new Mod(coll);
    } else {
      this.coll = coll;
    }
  }
}

/**
 * A Materialized Document with an ID. Keys, Tokens and Documents in
 * user-defined Collections are decoded into a {@link Document}. All top level
 * Document fields are added to a {@link Document} instance, but types cannot be
 * provided. Cast the instance to a {@link DocumentT} to have typesafe access to
 * all top level fields.
 *
 * @example
 * ```javascript
 *  const thing = await client.query(fql`
 *    Thing.byId("101")
 *  `);
 *
 *  const color = thing.color
 * ```
 *
 * @remarks The {@link Document} class cannot be generic because classes cannot
 * extend generic type arguments.
 */
export class Document extends DocumentRef {
  readonly ts: TimeStub;

  constructor(obj: { coll: Mod | string; id: string; ts: TimeStub }) {
    const { coll, id, ts, ...rest } = obj;
    super({ coll, id });
    this.ts = ts;
    Object.assign(this, rest);
  }

  toObject(): { coll: Mod; id: string; ts: TimeStub } {
    return { ...this } as { coll: Mod; id: string; ts: TimeStub };
  }
}

/**
 * A Reference to a Document with a name. The Document may or may not exists.
 * References to AccessProviders, Collections, Databases, Functions, etc. are
 * decoded into a {@link NamedDocumentRef}.
 *
 * @example
 * ```javascript
 *  const thingCollection = await client.query(fql`
 *    Thing.definition
 *  `);
 *
 *  const id = thingCollection.id
 * ```
 */
export class NamedDocumentRef {
  readonly coll: Mod;
  readonly name: string;

  constructor({ coll, name }: { coll: Mod | string; name: string }) {
    this.name = name;

    if (typeof coll === "string") {
      this.coll = new Mod(coll);
    } else {
      this.coll = coll;
    }
  }
}

/**
 * A Materialized Document with a name. AccessProviders, Collections, Databases,
 * Functions, etc. are decoded into a {@link NamedDocument}.
 *
 * @example
 * ```javascript
 *  const thingCollection = await client.query(fql`
 *    Thing.definition
 *  `);
 *
 *  const indexes = thingCollection.indexes
 * ```
 *
 * @example
 * All of the named Documents can have optional, user-defined data. The generic
 * class lets you define the shape of that data in a typesafe way
 * ```typescript
 *  type CollectionMetadata = {
 *    metadata: string
 *  }
 *
 *  const thingCollection = await client.query<NamedDocument<CollectionMetadata>>(fql`
 *    Thing.definition
 *  `);
 *
 *  const metadata = thingCollection.data.metadata
 * ```
 */
export class NamedDocument<
  T extends JSONObject = Record<string, never>
> extends NamedDocumentRef {
  readonly ts: TimeStub;
  readonly data?: T;

  constructor(obj: {
    coll: Mod | string;
    name: string;
    ts: TimeStub;
    data: T;
  }) {
    const { coll, name, ts, data, ...rest } = obj;
    super({ coll, name });
    this.ts = ts;
    this.data = data;
    Object.assign(this, rest);
  }

  toObject(): { coll: Mod; name: string; ts: TimeStub; data: T } {
    return { ...this } as { coll: Mod; name: string; ts: TimeStub; data: T };
  }
}

/**
 * A Fauna module, such as a Collection, Database, Function, Role, etc.
 *
 * @example
 * ```javascript
 *  const thingModule = await client.query(fql`
 *    Thing
 *  `);
 *
 *  const name = thingModule.name
 * ```
 */
export class Mod {
  readonly name: string;

  constructor(name: string) {
    this.name = name;
  }
}

/**
 * A Document extended with user-defined data. Typescript users can cast
 * instances of {@link Document} to {@link DocumentT} to access user-defined fields with type safety.
 *
 * @example
 * ```typescript
 *  type Thing = {
 *    color: string
 *  }
 *
 *  const thing = await client.query<DocumentT<Thing>>(fql`
 *    Thing.byId("101")
 *  `);
 *
 *  const color = thing.color
 * ```
 *
 * @remarks The {@link Document} class cannot be generic because classes cannot
 * extend generic type arguments.
 */
export type DocumentT<T extends JSONObject> = Document & T;
