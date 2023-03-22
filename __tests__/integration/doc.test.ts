import { getClient } from "../client";
import { fql } from "../../src/query-builder";
import {
  Document,
  DocumentT,
  DocumentReference,
  Module,
  NamedDocument,
  NamedDocumentReference,
  TimeStub,
} from "../../src/values";

const client = getClient({
  max_conns: 5,
  query_timeout_ms: 60_000,
});

let testDoc: Document;

describe("querying for doc types", () => {
  beforeAll(async () => {
    await client.query(fql`
      [
        if (Collection.byName("DocTest") == null) {
          Collection.create({ name: "DocTest" })
        },
        if (Collection.byName("DocTest2") == null) {
          Collection.create({ name: "DocTest2" })
        }
      ]
    `);

    const result = await client.query<Document>(fql`DocTest.create({})`);
    testDoc = result.data;
  });

  it("can round-trip Module", async () => {
    const mod = new Module("DocTest");

    const queryBuilder = fql`${mod}`;
    const result = await client.query<Module>(queryBuilder);

    expect(result.data).toBeInstanceOf(Module);
    expect(result.data.name).toBe("DocTest");
  });

  it("can round-trip DocumentReference to a non-existent doc", async () => {
    const mod = new Module("DocTest");
    const ref = new DocumentReference({ id: "101", coll: mod });

    const queryBuilder = fql`${ref}`;
    const result = await client.query<DocumentReference>(queryBuilder);

    expect(result.data).toBeInstanceOf(DocumentReference);
    expect(result.data).not.toBeInstanceOf(Document);
    expect(result.data.id).toBe("101");
    expect(result.data.coll.name).toBe("DocTest");
  });

  it("can round-trip DocumentReference to an existent doc", async () => {
    const ref = new DocumentReference(testDoc);

    const queryBuilder = fql`${ref}`;
    const result = await client.query<Document>(queryBuilder);

    expect(result.data).toBeInstanceOf(Document);
    expect(result.data.id).toBe(testDoc.id);
    expect(result.data.coll.name).toBe(testDoc.coll.name);
    expect(result.data.ts.isoString).toBe(testDoc.ts.isoString);
  });

  it("can round-trip Document", async () => {
    const queryBuilder = fql`${testDoc}`;
    const result = await client.query<Document>(queryBuilder);

    expect(result.data).toBeInstanceOf(Document);
    expect(result.data.id).toBe(testDoc.id);
    expect(result.data.coll.name).toBe(testDoc.coll.name);
    expect(result.data.ts.isoString).toBe(testDoc.ts.isoString);
  });

  it("can round-trip NamedDocumentReference", async () => {
    const mod = new Module("Collection");
    const ref = new NamedDocumentReference({ name: "DocTest", coll: mod });

    const queryBuilder = fql`${ref}`;
    const result = await client.query<NamedDocumentReference>(queryBuilder);

    expect(result.data).toBeInstanceOf(NamedDocumentReference);
    expect(result.data.name).toBe("DocTest");
    expect(result.data.coll.name).toBe("Collection");
  });

  it("can round-trip NamedDocument", async () => {
    const mod = new Module("Collection");
    const doc = new NamedDocument({
      name: "DocTest",
      coll: mod,
      ts: TimeStub.from("2023-10-16T00:00:00Z"),
    });

    const queryBuilder = fql`${doc}`;
    const result = await client.query<NamedDocument>(queryBuilder);

    expect(result.data).toBeInstanceOf(NamedDocument);
    expect(result.data.name).toBe("DocTest");
    expect(result.data.coll.name).toBe("Collection");
    expect(result.data.ts).toBeDefined();
  });

  it("get doc types from FQL", async () => {
    type MyResult = {
      module: Module;
      document: DocumentT<{
        documentReference: DocumentReference;
        namedDocumentReference: NamedDocumentReference;
      }>;
      namedDocument: NamedDocument;
    };

    const queryBuilder = fql`{
      module: DocTest,
      document: DocTest.create({
        documentReference: DocTest.create({}),
        namedDocumentReference: DocTest2.definition,
      }),
      namedDocument: DocTest.definition
    }`;
    const result = await client.query<MyResult>(queryBuilder);

    expect(result.data.module).toBeInstanceOf(Module);
    expect(result.data.document).toBeInstanceOf(Document);
    expect(result.data.document.documentReference).toBeInstanceOf(
      DocumentReference
    );
    expect(result.data.document.namedDocumentReference).toBeInstanceOf(
      NamedDocumentReference
    );
    expect(result.data.namedDocument).toBeInstanceOf(NamedDocument);
  });
});
