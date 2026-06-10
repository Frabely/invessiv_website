import { BoundedJsonBodyResultKind } from "@/common/constants/http/bounded-json-body-result-kind";

/**
 * Result of reading a request body with an enforced byte limit. The `kind`
 * discriminant uses the BoundedJsonBodyResultKind constant instead of raw
 * strings.
 */
export type BoundedJsonBodyResult =
  | { kind: typeof BoundedJsonBodyResultKind.Ok; payload: unknown }
  | { kind: typeof BoundedJsonBodyResultKind.PayloadTooLarge }
  | { kind: typeof BoundedJsonBodyResultKind.InvalidJson };
