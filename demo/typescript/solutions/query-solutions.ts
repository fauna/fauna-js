import { Client, endpoints, fql, type QuerySuccess } from "fauna";
import { randomUUID } from "node:crypto";
import { getSecret, type PartialCustomer } from "../utils";

const client: Client = new Client({
  max_conns: 10,
  secret: getSecret(),
  endpoint: endpoints.preview,
  queryOptions: {
    query_timeout_ms: 60_000,
  },
});

/**
 * Your task - use the client to query Fauna with the string "Hello World!".
 * Return the query result.
 * Try to use the `fql` function included with the driver!
 */
export async function helloWorldWithFql() {
  return client.query(fql`"Hello World!"`);
}

/**
 * Your task - Query for a set of 4 most expensive products.
 */
export async function getTop4MostExpensiveProducts() {
  return client.query(fql`Product.all.order(desc(.price)).limit(4)`);
}

/**
 * Your task - create a customer named: "Rip Van Winkle" with address: { street: 'Cat Mountain', city: 'Catskills', state: 'NY', country: 'USA, zip: 13451}
 * then fetch the customer by name.
 * Return the fetched customer.
 */
export async function createCustomer() {
  // this code would create a Rip Van Winkle customer:
  // await client.query(fql`
  //   Customer.create({
  //     name: "Rip Van Winkle",
  //     address: {
  //       city: "Catskills",
  //       state: "NY",
  //       country: "USA",
  //       zip: 13451,
  //       street: "Cat Mountain",
  //     }
  //   })
  // `);
  const allRipVanWinkles = await client.query(fql`
    Customer.where(
      .name == "Rip Van Winkle" &&
      .address.city == "Catskills" &&
      .address.state == "NY" &&
      .address.country == "USA" &&
      .address.zip == 13451 &&
      .address.street == "Cat Mountain"
    )
  `);
  if (allRipVanWinkles.data.data.length < 1) {
    // return a random UUID to force a false result.
    return randomUUID();
  }
  return allRipVanWinkles;
}

/**
 * The driver allows you to expect a type to be returned from your query.
 * This allows you to build typesafe code (so long as the type you specify
 * actually matches the data your query returns - this is not yet enforceable
 * by Fauna).
 * Your task - return a PartialCustomer representation of the first "Rip Van Winkle"
 * in your Customer collection. The PartialCustomer type is defined in ../utils
 * and is { name: string, city: string }. So your job is to return an object from
 * this method conforming to that type. Try to do so by using an FQL X query directly,
 * rather than building the object in Typescript.
 */
export async function usingTypes(): Promise<QuerySuccess<PartialCustomer>> {
  // This would also work:
  // return client.query<PartialCustomer>(fql`
  //   let customer = Customer.firstWhere(.name == "Rip Van Winkle")
  //   { name: customer.name, city: customer.address.city }
  // `);
  return client.query(fql`
    Customer.where(.name == "Rip Van Winkle")
    .map((c) => { name: c.name, city: c.address.city })
    .first()
  `);
}

/**
 * With FQL X you can compose queries from other FQL X queries. This is supported
 * both in the drivers, where language specifics can be levaraged,
 * will eventually be found natively on the wire-protocol.
 * See the README of this package for more details on usage in this driver.
 * Your task - complete the following composed query and return the result.
 */
export async function composingQueries(): Promise<void | QuerySuccess<string>> {
  const mostExpensiveProductName = fql`Product.all.order(desc(.price)).limit(1).name`;
  const inferredCustomer = "well fed cat";
  return client.query(fql`
     if (${mostExpensiveProductName} == 'catfood') {
        ${inferredCustomer}
     } else {
        "Not a cat"
     }
  `);
}

/**
 * The FQL X wire protocol exposes a two main categories of errors -
 * ServiceError (and its children) that encapsulate errors emitted directly
 * from Fauna; and ProtocolError - errors that did not originate from Fauna
 * but do originate from the HTTP protocol Fauna uses.
 * The driver exposes two more error types - ClientError which is due to a
 * a runtime error in the driver itself; and NetworkError which is due to a
 * problem with network connections.
 * Each FQL X driver will expose this same error taxonomy - ServiceError, ProtocolError,
 * ClientError, and NetowrkError. This exercise exposes four bad queries. Each with a
 * different root cause - but exposed by the driver. Your task is to use the errors emitted
 * by Fauna to fix the errors.
 * The focus here is on ServiceError and its children.
 * Once you fix the errors the return statement will return the data the exercise expects.
 */
export async function correctingErrors(): Promise<Array<QuerySuccess<any>>> {
  const cityLengthFql = (lengthLimit: any) =>
    fql`c => c.address.city.length > ${lengthLimit}`;
  try {
    // get 3 customers that live in Catskills
    const catskillCustomers = await client.query(fql`
      Customer.all.where(.address.city == "Catskills").limit(3)
    `);

    // get all customers that live in cities names that more than 5 letters.
    const customersInLongCityNames = await client.query(fql`
      Customer.all.where(${cityLengthFql(5)})
    `);

    const allProducts = await client.query(fql`Product.all`);
    return [catskillCustomers, customersInLongCityNames, allProducts];
  } catch (e) {
    console.error(e);
    throw new Error("The demo application encountered an unexpected problem.");
  }
}
