"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";

type VersionedMutationOutcome<TEntity, TCode extends string> =
  | { ok: true }
  | {
      ok: false;
      code: typeof ConcurrencyErrorCode.VersionConflict;
      current: TEntity;
    }
  | { ok: false; code: TCode };

/**
 * Runs a versioned write from a dialog: refreshes and closes on success, keeps the user's input
 * and adopts the fresh state on a version conflict, and exposes every other failure as a code.
 */
export function useVersionedMutation<TEntity, TCode extends string>(
  initial: TEntity,
  onSuccessAction: () => void,
) {
  const router = useRouter();
  const [current, setCurrent] = useState(initial);
  const [errorCode, setErrorCode] = useState<TCode | null>(null);
  const [hasConflict, setHasConflict] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(
    mutate: (
      current: TEntity,
    ) => Promise<VersionedMutationOutcome<TEntity, TCode>>,
  ) {
    setIsSubmitting(true);
    setErrorCode(null);
    setHasConflict(false);

    const outcome = await mutate(current);
    if (outcome.ok) {
      router.refresh();
      onSuccessAction();
      return;
    }

    setIsSubmitting(false);
    if ("current" in outcome) {
      setCurrent(outcome.current);
      setHasConflict(true);
      return;
    }
    setErrorCode(outcome.code);
  }

  return { current, errorCode, hasConflict, isSubmitting, submit };
}
