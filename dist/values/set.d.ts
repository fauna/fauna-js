import { JSONValue } from "../wire-protocol";
export declare class Set<T extends JSONValue> {
    readonly data: T[];
    readonly after?: string;
    constructor({ data, after }: {
        data: T[];
        after?: string;
    });
}
