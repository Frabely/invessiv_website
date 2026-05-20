import type { RefinementCtx } from "zod";

type QuickContactValidationShape = {
  message: string;
};

export function applyQuickContactValidationRules(
  value: QuickContactValidationShape,
  context: RefinementCtx,
) {
  void value;
  void context;
}
