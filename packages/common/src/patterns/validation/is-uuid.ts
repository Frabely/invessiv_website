import { z } from "zod";

const UUID_SCHEMA = z.uuid();

/**
 * Whether a value has the shape of an id this app stores. It is the same rule the server schemas
 * apply (`z.uuid()`), so an id that passes here is never rejected there for its shape alone.
 */
export function isUuid(value: string): boolean {
  return UUID_SCHEMA.safeParse(value).success;
}
