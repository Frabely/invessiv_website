export type JsonClientResult<TValue, TCode extends string> =
  { ok: true; value: TValue } | { ok: false; code: TCode };
