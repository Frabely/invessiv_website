/** `cents: null` means the field was left empty, which is valid for optional amounts. */
export type EuroCentsParseResult =
  { ok: true; cents: number | null } | { ok: false };
