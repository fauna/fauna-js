import {
  ChangeFeedSuccess,
  QueryValue,
  StreamEventData,
  QueryStats,
} from "../wire-protocol";
import { getServiceError } from "../errors";

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

/**
 * A class to represent a page of events from a Fauna stream.
 */
export class ChangeFeedPage<T extends QueryValue> {
  readonly events: IterableIterator<StreamEventData<T>>;
  readonly cursor: string;
  readonly hasNext: boolean;
  readonly stats?: QueryStats;

  constructor({ events, cursor, has_next, stats }: ChangeFeedSuccess<T>) {
    this.events = this.#toStreamEventIterator(events);
    this.cursor = cursor;
    this.hasNext = has_next;
    this.stats = stats;
  }

  *#toStreamEventIterator(
    events: ChangeFeedSuccess<T>["events"],
  ): IterableIterator<StreamEventData<T>> {
    // A page of events may contain an error event. These won't be reported
    // at a response level, so we need to check for them here. They are
    // considered fatal.
    for (const event of events) {
      if (event.type === "error") {
        throw getServiceError(event);
      }

      yield event;
    }
  }
}
