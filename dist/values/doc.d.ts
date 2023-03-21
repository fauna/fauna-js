import { JSONObject } from "../wire-protocol";
import { TimeStub } from "./date-time";
/**
 * A reference to a Document with an ID. The Document may or may not exist.
 * References to Keys, Tokens, and Documents in user-defined Collections are
 * modeled with a {@link DocumentReference}.
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
export declare class DocumentReference {
    readonly coll: Module;
    readonly id: string;
    constructor({ coll, id }: {
        coll: Module | string;
        id: string;
    });
}
/**
 * A materialized Document with an ID. Keys, Tokens and Documents in
 * user-defined Collections are modeled with a {@link Document}. All top level
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
export declare class Document extends DocumentReference {
    readonly ts: TimeStub;
    constructor(obj: {
        coll: Module | string;
        id: string;
        ts: TimeStub;
        [key: string]: any;
    });
    toObject(): {
        coll: Module;
        id: string;
        ts: TimeStub;
    };
}
/**
 * A reference to a Document with a name. The Document may or may not exist.
 * References to specific AccessProviders, Collections, Databases, Functions, etc. are
 * modeled with a {@link NamedDocumentReference}.
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
export declare class NamedDocumentReference {
    readonly coll: Module;
    readonly name: string;
    constructor({ coll, name }: {
        coll: Module | string;
        name: string;
    });
}
/**
 * A materialized Document with a name. Specific AccessProviders, Collections, Databases,
 * Functions, etc. that include user defined data are modeled with a {@link NamedDocument}.
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
export declare class NamedDocument<T extends JSONObject = Record<string, never>> extends NamedDocumentReference {
    readonly ts: TimeStub;
    readonly data: T;
    constructor(obj: {
        coll: Module | string;
        name: string;
        ts: TimeStub;
        data?: T;
    });
    toObject(): {
        coll: Module;
        name: string;
        ts: TimeStub;
        data: T;
    };
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
export declare class Module {
    readonly name: string;
    constructor(name: string);
}
/**
 * A Document typed with a user-defined data type. Typescript users can cast
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
