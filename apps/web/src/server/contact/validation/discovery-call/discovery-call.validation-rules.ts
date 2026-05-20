import type { RefinementCtx } from "zod";

type DiscoveryCallValidationShape = {
  message?: string;
};

export function applyDiscoveryCallValidationRules(
  value: DiscoveryCallValidationShape,
  context: RefinementCtx,
) {
  void value;
  void context;
}
