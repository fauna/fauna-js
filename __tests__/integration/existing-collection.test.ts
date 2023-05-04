import { fql, ServiceError } from "../../src";
import { getClient } from "../client";

const client = getClient();

const authorsData = [
  {
    firstName: "one",
    lastName: "one",
    genre: "mystery",
  },
  {
    firstName: "two",
    lastName: "two",
    genre: "fantasy",
  },
  {
    firstName: "three",
    lastName: "four",
    genre: "sci-fi",
  },
  {
    firstName: "five",
    lastName: "six",
    genre: "sci-fi",
  },
  {
    firstName: "seven",
    lastName: "eight",
    genre: "mystery",
  },
];

afterAll(() => {
  client.close();
});

beforeAll(async () => {
  /**
   * The intent of these tests is to run against an already existing collection and so
   * the creation/schema updates aren't necessary.  The below collection/schema creation
   * is intended to only be run the first time this is executed for a given environment.
   * The actual data creation is fine to execute multiple times due to the presence of the
   * unique constraint in the schema.
   */
  console.log(
    await client.query(fql`
  if (Collection.byName("Authors") == null) {
    Collection.create({
      name: "Authors",
      indexes: {
        byName: {
          terms: [ { field: "firstName" }, { field: "lastName" } ]
        },
        byGenre: {
          terms: [ { field: "genre" } ]
        }
      },
      constraints: [
        { unique: [ "firstName", "lastName" ] }
      ]
    })
  } else {
    "Authors already exists."
  }
    `)
  );
  for (const author of authorsData) {
    try {
      await client.query(fql`
    Authors.create(${author})
    `);
    } catch (error) {
      if (error instanceof ServiceError) {
        // we expect unique constraint errors to happen with our schema
        if (!error.message.includes("unique constraint")) {
          throw error;
        }
      } else {
        throw error;
      }
    }
  }
});

describe("querying for existing data", () => {
  it("Can query an existing index", async () => {
    const authorsByScifi = [
      {
        firstName: "three",
        lastName: "four",
        genre: "sci-fi",
      },
      {
        firstName: "five",
        lastName: "six",
        genre: "sci-fi",
      },
    ];

    const result = await client.query<any>(fql`
    Authors.byGenre("sci-fi") {
      firstName,
      lastName,
      genre
    }
    `);
    expect(result.data.data).toEqual(authorsByScifi);
  });
});
