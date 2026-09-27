export const HttpHeaderName = {
  ContentType: "Content-Type",
  RetryAfter: "Retry-After",
} as const;

export type HttpHeaderName =
  (typeof HttpHeaderName)[keyof typeof HttpHeaderName];
