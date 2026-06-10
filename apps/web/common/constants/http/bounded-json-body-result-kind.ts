/** Discriminant values for bounded JSON body reads (see BoundedJsonBodyResult). */
export const BoundedJsonBodyResultKind = {
  Ok: "ok",
  PayloadTooLarge: "payload_too_large",
  InvalidJson: "invalid_json",
} as const;

export type BoundedJsonBodyResultKind =
  (typeof BoundedJsonBodyResultKind)[keyof typeof BoundedJsonBodyResultKind];
