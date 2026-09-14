export const HttpHeaderName = {
  ContentType: "Content-Type",
} as const;

export type HttpHeaderName =
  (typeof HttpHeaderName)[keyof typeof HttpHeaderName];
