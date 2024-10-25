import {
  FeedSuccess,
  QueryValue,
  StreamEventData,
  QueryStats,
} from "../wire-protocol";
import { getServiceError } from "../errors";

/**
 * A token used to initiate a Fauna event source at a particular snapshot in time.
 *
 * The example below shows how to request an event token from Fauna and use it
 * to establish an event steam.
 *
 * @example
 * ```javascript
 *  const response = await client.query(fql`
 *    Messages.byRecipient(User.byId("1234"))
 *  `);
 *  const eventSource = response.data;
 *
 *  const stream = client.stream(eventSource)
 *    .on("add", (event) => console.log("New message", event))
 *
 *  stream.start();
 * ```
 */
export interface EventSource {
  readonly token: string;
}

export function isEventSource(value: any): value is EventSource {
  if (typeof value.token === "string") {
    return true;
  }

  return false;
}

export class StreamToken implements EventSource {
  readonly token: string;

  constructor(token: string) {
    this.token = token;
  }
}

/**
 * A class to represent a page of events from a Fauna stream.
 */
export class FeedPage<T extends QueryValue> {
  readonly events: IterableIterator<StreamEventData<T>>;
  readonly cursor: string;
  readonly hasNext: boolean;
  readonly stats?: QueryStats;

  constructor({ events, cursor, has_next, stats }: FeedSuccess<T>) {
    this.events = this.#toEventIterator(events);
    this.cursor = cursor;
    this.hasNext = has_next;
    this.stats = stats;
  }

  *#toEventIterator(
    events: FeedSuccess<T>["events"],
  ): IterableIterator<StreamEventData<T>> {
    // A page of events may contain an error event. These won't be reported
    // at a response level, so we need to check for them here. They are
    // considered fatal. Pages end at the first error event.
    for (const event of events) {
      if (event.type === "error") {
        throw getServiceError(event);
      }

      yield event;
    }
  }
}
