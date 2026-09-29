/** Dictionary templates for a counted phrase; `{count}` is replaced in every one of them. */
export interface CountMessageTemplates {
  /** Text for zero; without it, zero uses `many` ("0 Runden"). */
  none?: string;
  /** Text for exactly one. */
  one: string;
  /** Text for every other count. */
  many: string;
}
