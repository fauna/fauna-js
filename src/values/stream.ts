/**
 * A token used to initiate a Fauna stream at a particular snapshot in time.
 *
 * The example below shows how to request a stream token from Fauna and use it
 * to establish an event steam.
 *
 * @example
 * ```javascript
 *  const response = await client.query(fql`
 *    Messages.byRecipient(User.byId("1234"))
 *  `);
 *  const token = response.data;
 *
 *  const stream = client.stream(token)
 *    .on("add", (event) => console.log("New message", event))
 *
 *  stream.start();
 * ```
 */
export class StreamToken {
  readonly token: string;

  constructor(token: string) {
    this.token = token;
  }
}
