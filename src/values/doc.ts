import { QueryValueObject } from "../wire-protocol";
import { TimeStub } from "./date-time";

/**
 * A reference to a Document with an ID. The Document may or may not exist.
 * References to Keys, Tokens, and Documents in user-defined Collections are
 * modeled with a {@link DocumentReference}.
 *
 * The example below retrieves a document reference from a
 * hypothetical "Users" collection.
 *
 * @example
 * ```javascript
 *  const response = await client.query(fql`
 *    Users.byId("101")
 *  `);
 *  const userDocumentReference = response.data;
 *
 *  const id = userDocumentReference.id;
 *  id === "101"; // returns true
 * ```
 */
export class DocumentReference {
  readonly coll: Module;
  readonly id: string;

  constructor({ coll, id }: { coll: Module | string; id: string }) {
    this.id = id;

    if (typeof coll === "string") {
      this.coll = new Module(coll);
    } else {
      this.coll = coll;
    }
  }
}

/**
 * A materialized Document with an ID. Keys, Tokens and Documents in
 * user-defined Collections are modeled with a {@link Document}. All top level
 * Document fields are added to a {@link Document} instance, but types cannot be
 * provided. Cast the instance to a {@link DocumentT} to have typesafe access to
 * all top level fields.
 *
 * The example below retrieves a document from a
 * hypothetical "Users" collection.
 *
 * @example
 * ```javascript
 *  const response = await client.query(fql`
 *    Users.byId("101")
 *  `);
 *  const userDocument = response.data;
 *
 *  const color = userDocument.color;
 * ```
 *
 * @remarks The {@link Document} class cannot be generic because classes cannot
 * extend generic type arguments.
 */
export class Document extends DocumentReference {
  readonly ts: TimeStub;

  constructor(obj: {
    coll: Module | string;
    id: string;
    ts: TimeStub;
    [key: string]: any;
  }) {
    const { coll, id, ts, ...rest } = obj;
    super({ coll, id });
    this.ts = ts;
    Object.assign(this, rest);
  }

  toObject(): { coll: Module; id: string; ts: TimeStub } {
    return { ...this } as { coll: Module; id: string; ts: TimeStub };
  }
}

/**
 * A reference to a Document with a name. The Document may or may not exist.
 * References to specific AccessProviders, Collections, Databases, Functions, etc. are
 * modeled with a {@link NamedDocumentReference}.
 *
 * The example below retrieves a NamedDocumentReference for a hypothetical
 * "Users" collection.
 *
 * @example
 * ```javascript
 *  const response = await client.query(fql`
 *    Users.definition
 *  `);
 *  const namedDocumentReference = response.data;
 *
 *  const collectionName = namedDocumentReference.name;
 *  collectionName === "Users"; // returns true
 * ```
 */
export class NamedDocumentReference {
  readonly coll: Module;
  readonly name: string;

  constructor({ coll, name }: { coll: Module | string; name: string }) {
    this.name = name;

    if (typeof coll === "string") {
      this.coll = new Module(coll);
    } else {
      this.coll = coll;
    }
  }
}

/**
 * A materialized Document with a name. Specific AccessProviders, Collections, Databases,
 * Functions, etc. that include user defined data are modeled with a {@link NamedDocument}.
 *
 * The example below retrieves a NamedDocument for a hypothetical
 * "Users" collection.
 *
 * @example
 * ```javascript
 *  const response = await client.query(fql`
 *    Users.definition
 *  `);
 *  const userCollectionNamedDocument = response.data;
 *
 *  const indexes = userCollectionNamedDocument.indexes;
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
 *  const response = await client.query<NamedDocument<CollectionMetadata>>(fql`
 *    Users.definition
 *  `);
 *  const userCollection = response.data;
 *
 *  const metadata = userCollection.data.metadata;
 * ```
 */
export class NamedDocument<
  T extends QueryValueObject = Record<string, never>
> extends NamedDocumentReference {
  readonly ts: TimeStub;
  readonly data: T;

  constructor(obj: {
    coll: Module | string;
    name: string;
    ts: TimeStub;
    data?: T;
  }) {
    const { coll, name, ts, data, ...rest } = obj;
    super({ coll, name });
    this.ts = ts;
    this.data = data || ({} as T);
    Object.assign(this, rest);
  }

  toObject(): { coll: Module; name: string; ts: TimeStub; data: T } {
    return { ...this } as { coll: Module; name: string; ts: TimeStub; data: T };
  }
}

/**
 * A Fauna module, such as a Collection, Database, Function, Role, etc.
 * Every module is usable directly in your FQL code.
 *
 * The example below shows FQL code that gets all documents for a hypothetical
 * 'Users' collection by creating a Module for user and then calling .all().
 *
 * You can also create modules for databases, functions, roles and other
 * entities in your database.
 *
 * @example
 * ```javascript
 *  const response = await client.query(fql`
 *    ${new Module("Users")}.all()
 *  `);
 *  const allUserDocuments = response.data;
 * ```
 */
export class Module {
  readonly name: string;

  constructor(name: string) {
    this.name = name;
  }
}

/**
 * A reference to a Document or Named Document that could not be read. The
 * Document may or may not exist in future queries. The cause field specifies
 * the reason the document could not be read, typically because the Document
 * does not exist or due to insufficient privileges.
 *
 * Some read operations, such as the `<Collection>.byId` method may return
 * either a Document or a NullDocument. This example shows how to handle such a
 * result with the driver
 *
 * @example
 * ```typescript
 *  const response = await client.query<Document | NullDocument>(fql`
 *    Users.byId("101")
 *  `);
 *  const maybeUserDocument = response.data;
 *
 *  if (maybeUserDocument instanceof NullDocument) {
 *    // handle NullDocument case
 *    const cause = maybeUserDocument.cause
 *  } else {
 *    // handle Document case
 *    const color = maybeUserDocument.color;
 *  }
 * ```
 */
export class NullDocument {
  readonly ref: DocumentReference | NamedDocumentReference;
  readonly cause: string;

  constructor(ref: DocumentReference | NamedDocumentReference, cause: string) {
    this.ref = ref;
    this.cause = cause;
  }
}

/**
 * A Document typed with a user-defined data type. Typescript users can cast
 * instances of {@link Document} to {@link DocumentT} to access user-defined fields with type safety.
 *
 * The example below creates a local type "User" that is applied to queries for documents in a
 * hypothetical "Users" collection.
 *
 * @example
 * ```typescript
 *  type User = {
 *    color: string
 *  }
 *
 *  const response = await client.query<DocumentT<User>>(fql`
 *    Users.byId("101")
 *  `);
 *  const user = response.data;
 *
 *  const color = user.color;
 * ```
 *
 * @remarks The {@link Document} class cannot be generic because classes cannot
 * extend generic type arguments.
 */
export type DocumentT<T extends QueryValueObject> = Document & T;
