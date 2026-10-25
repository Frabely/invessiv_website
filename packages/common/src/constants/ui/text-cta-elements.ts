/** Elements a text link can render as. */
export const TextCtaElement = {
  Anchor: "a",
  Button: "button",
  Summary: "summary",
} as const;

export type TextCtaElement =
  (typeof TextCtaElement)[keyof typeof TextCtaElement];
