/** Reads the `{ code }` error shape shared by files, chat and portal feedback. */
export function readApiErrorCode<TCode extends string>(
  payload: unknown,
  knownCodes: readonly TCode[],
  fallback: TCode,
): TCode {
  const code =
    typeof payload === "object" && payload !== null && "code" in payload
      ? payload.code
      : undefined;
  return knownCodes.find((known) => known === code) ?? fallback;
}
