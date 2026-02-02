import { Timestamp } from "firebase-admin/firestore";

type Primitive = string | number | boolean | null | undefined | bigint | symbol;
type JsonLike = Primitive | Date | Timestamp | JsonLike[] | { [k: string]: JsonLike };

export function datesToTimestamps<T>(input: T): T {
    return walk(input, {
        onDate: (d) => Timestamp.fromDate(d),
        onTimestamp: (t) => t,
    }) as T;
}

export function timestampsToDates<T>(input: T): T {
    return walk(input, {
        onDate: (d) => d,
        onTimestamp: (t) => t.toDate(),
    }) as T;
}

function walk(
    value: unknown,
    handlers: {
        onDate: (d: Date) => unknown;
        onTimestamp: (t: Timestamp) => unknown;
    }
): unknown {
    if (value == null) return value;

    if (value instanceof Date) return handlers.onDate(value);

    if (value instanceof Timestamp) return handlers.onTimestamp(value);

    if (Array.isArray(value)) return value.map((v) => walk(v, handlers));

    if (isPlainObject(value)) {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(value)) {
            out[k] = walk(v, handlers);
        }
        return out;
    }

    return value;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
    if (typeof value !== "object" || value === null) return false;
    const proto = Object.getPrototypeOf(value);
    return proto === Object.prototype || proto === null;
}

export const EntityMapper = {
    toFirestore: (payload: Record<string, any>) => {
        return datesToTimestamps<JsonLike>(payload) as Record<string, any>;
    },
    toDomain: <T = Record<string, any>>(payload: Record<string, any>) => {
        return timestampsToDates<JsonLike>(payload) as T;
    }
}