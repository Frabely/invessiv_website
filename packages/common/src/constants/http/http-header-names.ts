export const HttpHeaderName = {
  CacheControl: "Cache-Control",
  ContentDisposition: "Content-Disposition",
  ContentSecurityPolicy: "Content-Security-Policy",
  XContentTypeOptions: "X-Content-Type-Options",
  ContentType: "Content-Type",
  RetryAfter: "Retry-After",
  Range: "Range",
  ContentRange: "Content-Range",
} as const;

export type HttpHeaderName =
  (typeof HttpHeaderName)[keyof typeof HttpHeaderName];
