export const HttpHeaderName = {
  ContentType: "Content-Type",
  RetryAfter: "Retry-After",
  Range: "Range",
  ContentRange: "Content-Range",
} as const;

export type HttpHeaderName =
  (typeof HttpHeaderName)[keyof typeof HttpHeaderName];
