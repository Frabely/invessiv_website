/**
 * Layout the generator workbench renders for a given state. Const-object +
 * derived type per project convention.
 */
export const GeneratorSectionLayout = {
  Initial: "initial",
  Loading: "loading",
  Split: "split",
  Limit: "limit",
  Result: "result",
} as const;

export type GeneratorSectionLayout =
  (typeof GeneratorSectionLayout)[keyof typeof GeneratorSectionLayout];
