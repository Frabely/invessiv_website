export const HttpResponseCode = {
  Ok: 200,
  Created: 201,
  BadRequest: 400,
  Unauthorized: 401,
  Forbidden: 403,
  NotFound: 404,
  Conflict: 409,
  PayloadTooLarge: 413,
  UnsupportedMediaType: 415,
  TooManyRequests: 429,
  UnprocessableContent: 422,
  ServiceUnavailable: 503,
  InternalServerError: 500,
} as const;

export type HttpResponseCode =
  (typeof HttpResponseCode)[keyof typeof HttpResponseCode];
