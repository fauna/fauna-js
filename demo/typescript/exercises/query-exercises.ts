import { Client, endpoints, fql, type QueryResponse, } from "fauna";
import { getSecret, type PartialCustomer } from "../utils";

const client: Client = new Client({
  max_conns: 10,
  secret: getSecret(),
  endpoint: endpoints.preview,
  timeout_ms: 60_000,
});

/**
 * Your task - use the client to query Fauna with the string "Hello World!".
 * Return the query result.
 * Try to use the `fql` function included with the driver!
*/
export async function helloWorldWithFql() {
  // return the result of the query
}

/**
 * Your task - Query for a set of 4 most expensive products.
*/
export async function getTop4MostExpensiveProducts() {
  // return the result of the query
}

/**
 * Your task - create a customer named: "Rip Van Winkle" with address: { street: 'Cat Mountain', city: 'Catskills', state: 'NY', country: 'USA', zip: 13451}
 * then fetch and return all customers with this name and address.
*/
export async function createCustomer() {
  // return the result of the query for all customers with the name and address
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
export async function usingTypes(): Promise<void | QueryResponse<PartialCustomer>> {
  // return the result of the query
}

/**
 * With FQL X you can compose queries from other FQL X queries. This is supported
 * both in the drivers, where language specifics can be levaraged,
 * will eventually be found natively on the wire-protocol.
 * See the README of this package for more details on usage in this driver.
 * Your task - complete the following composed query and return the result.
 */
export async function composingQueries(): Promise<void | QueryResponse<string>> {
  // write and return a query that infers who the typical customer is of the most expensive
  // product in the Product collection.
  // Your query should return "well fed cat" if the most expensive product has the name catfood
  // and "Not a cat" for anything else.
  //
  // A basic skeleton is provided here. Try to use fql snippets to do this!
  const mostExpensiveProductName = fql`???`;
  const inferredCustomer = "???";
  // here's your hint - feel free to write it a totally different way too!
  // return client.query(fql`
  //    if (???) {
  //      ???
  //    } else {
  //       "Not a cat"
  //    }
  // `);
  return;
}


/**
 * This exercise exposes four bad queries. Each with a different root cause,
 * but exposed by the driver. Your task is to use the errors emitted by Fauna to fix the errors.
 * The focus here is on ServiceError and its children.  Once you fix the errors 
 * the return statement will return the data the exercise expects.
*/
export async function correctingErrors(): Promise<Array<QueryResponse<any>> | void> {
  const cityLengthFql = (lengthLimit: any) => fql`c => c.city.length > ${lengthLimit}`;
  try {
    // get 3 customers that live in Catskills
    const catskillCustomers = await client.query(fql`
       Customers.all.where(.addres.city == "Catskills").limit("3")
    `);
    
    // get all customers that live in cities names that more than 5 letters.
    const customersInLongCityNames = await client.query(fql`
       Customers.all.where(${cityLengthFql("5")})
    `);
    
    const allProducts = await client.query(
      fql`Product.all`, { timeout_ms: 1 }
    );
    return [catskillCustomers, customersInLongCityNames, allProducts];
  } catch (e) {
    // UNCOMMENT THIS TO DEBUG!!!
    //    console.log("correctingErrors exercise error: ", e);
  }
}
