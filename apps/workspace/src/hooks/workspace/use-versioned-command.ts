"use client";

import { useState } from "react";

import type { VersionedJsonMutationResult } from "@/common/contracts/client/versioned-json-mutation-result";
import type { VersionedMutationOutcome } from "@/common/contracts/client/versioned-mutation-outcome";
import { settleVersionedResult } from "@/common/patterns/client/settle-versioned-result";

/**
 * For versioned writes of a surface that stays open afterwards (list actions, inline forms), where
 * `useVersionedMutation` would close it. Tracks the busy state across the call and sorts the answer;
 * what each outcome shows stays with the surface.
 */
export function useVersionedCommand() {
  const [busy, setBusy] = useState(false);

  async function run<TValue, TErrorCode extends string>(
    call: () => Promise<VersionedJsonMutationResult<TValue, TErrorCode>>,
  ): Promise<VersionedMutationOutcome<TValue, TErrorCode>> {
    setBusy(true);
    try {
      return settleVersionedResult(await call());
    } finally {
      setBusy(false);
    }
  }

  return { busy, run };
}
