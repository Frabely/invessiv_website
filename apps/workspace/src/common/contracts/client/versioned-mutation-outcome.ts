import type { VersionedMutationOutcomeKind } from "@/common/constants/client/versioned-mutation-outcome-kinds";

/**
 * The answer of a versioned write sorted by what a surface does next: take the new state, adopt
 * the current state and keep the input, or show why nothing was written.
 */
export type VersionedMutationOutcome<TValue, TErrorCode extends string> =
  | { kind: typeof VersionedMutationOutcomeKind.Saved; value: TValue }
  | { kind: typeof VersionedMutationOutcomeKind.Conflict; current: TValue }
  | { kind: typeof VersionedMutationOutcomeKind.Failure; code: TErrorCode };
