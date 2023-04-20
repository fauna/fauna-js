import {
  Document,
  DocumentT,
  DocumentReference,
  Module,
  NamedDocument,
  NamedDocumentReference,
  NullDocument,
  TimeStub,
} from "../../src";

describe("Module", () => {
  it("can be constructed directly", () => {
    const mod = new Module("Thing");
    expect(mod.name).toBe("Thing");
  });
});

describe("DocumentReference", () => {
  it("can be constructed directly", () => {
    const mod = new Module("Thing");
    const ref = new DocumentReference({ id: "101", coll: mod });
    expect(ref.id).toBe("101");
    expect(ref.coll.name).toBe("Thing");
  });
});

describe("Document", () => {
  it("can be constructed directly", () => {
    const mod = new Module("Thing");
    const doc = new Document({
      id: "101",
      coll: mod,
      ts: TimeStub.from("2023-10-16T00:00:00Z"),
    });
    expect(doc.id).toBe("101");
    expect(doc.coll.name).toBe("Thing");
    expect(doc.ts.isoString).toBe("2023-10-16T00:00:00Z");
  });

  it("can access user data", () => {
    const doc = new Document({
      coll: new Module("User"),
      id: "1234",
      ts: TimeStub.from("2023-03-09T00:00:00Z"),
      email: "alice@site.example",
      name: "Alice",
    }) as DocumentT<{
      email: string;
      name: string;
    }>;
    expect(doc.coll.name).toBe("User");
    expect(doc.id).toBe("1234");
    expect(doc.ts.isoString).toBe("2023-03-09T00:00:00Z");
    expect(doc.email).toBe("alice@site.example");
    expect(doc.name).toBe("Alice");
  });
});

describe("NamedDocumentReference", () => {
  it("can be constructed directly", () => {
    const mod = new Module("Collection");
    const ref = new NamedDocumentReference({ name: "Thing", coll: mod });
    expect(ref.name).toBe("Thing");
    expect(ref.coll.name).toBe("Collection");
  });
});

describe("NamedDocument", () => {
  it("can be constructed without data", () => {
    const mod = new Module("Collection");
    const doc = new NamedDocument({
      name: "Thing",
      coll: mod,
      ts: TimeStub.from("2023-10-16T00:00:00Z"),
    });
    expect(doc.name).toBe("Thing");
    expect(doc.coll.name).toBe("Collection");
    expect(doc.ts.isoString).toBe("2023-10-16T00:00:00Z");
    expect(doc.data).toStrictEqual({});
  });

  it("can be constructed without data", () => {
    const mod = new Module("Collection");
    const doc = new NamedDocument<{ metadata: string }>({
      name: "Thing",
      coll: mod,
      ts: TimeStub.from("2023-10-16T00:00:00Z"),
      data: { metadata: "metadata" },
    });

    expect(doc.name).toBe("Thing");
    expect(doc.coll.name).toBe("Collection");
    expect(doc.ts.isoString).toBe("2023-10-16T00:00:00Z");
    expect(doc.data).toStrictEqual({ metadata: "metadata" });
  });
});

describe("NullDocument", () => {
  it("can be constructed directly with a DocumentReference", () => {
    expect.assertions(3);
    const mod = new Module("Thing");
    const ref = new DocumentReference({ id: "101", coll: mod });
    const nullDoc = new NullDocument(ref, "not found");
    if (nullDoc.ref instanceof DocumentReference) {
      expect(nullDoc.ref.id).toBe("101");
      expect(nullDoc.ref.coll.name).toBe("Thing");
    }
    expect(nullDoc.cause).toBe("not found");
  });

  it("can be constructed directly with a NamedDocumentReference", () => {
    expect.assertions(3);
    const mod = new Module("Collection");
    const ref = new NamedDocumentReference({ name: "Thing", coll: mod });
    const nullDoc = new NullDocument(ref, "permission denied");
    if (nullDoc.ref instanceof NamedDocumentReference) {
      expect(nullDoc.ref.name).toBe("Thing");
      expect(nullDoc.ref.coll.name).toBe("Collection");
    }
    expect(nullDoc.cause).toBe("permission denied");
  });
});
