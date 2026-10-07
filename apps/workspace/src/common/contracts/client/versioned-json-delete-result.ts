import type { VersionedJsonMutationResult } from "./versioned-json-mutation-result";

export type VersionedJsonDeleteResult<TCurrent, TCode extends string> =
  | { ok: true }
  | Exclude<VersionedJsonMutationResult<TCurrent, TCode>, { ok: true }>;
