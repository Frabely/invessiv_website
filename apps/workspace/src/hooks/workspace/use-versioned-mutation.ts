"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";

type VersionedMutationOutcome<TEntity, TCode extends string> =
  | { ok: true; current?: TEntity }
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
  onCloseAction: () => void,
) {
  const router = useRouter();
  const [current, setCurrent] = useState(initial);
  const [errorCode, setErrorCode] = useState<TCode | null>(null);
  const [hasConflict, setHasConflict] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function close() {
    // A failed write can make the data behind the dialog stale even when the dialog is dismissed.
    if (hasConflict || errorCode) {
      router.refresh();
    }
    onCloseAction();
  }

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
      if (outcome.current !== undefined) {
        setCurrent(outcome.current);
      }
      router.refresh();
      onCloseAction();
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

  return { close, current, errorCode, hasConflict, isSubmitting, submit };
}
