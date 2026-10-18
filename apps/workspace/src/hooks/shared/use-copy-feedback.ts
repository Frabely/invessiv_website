import { useEffect, useRef, useState } from "react";
import { CopyFeedbackStatus } from "@/common/constants/credentials/copy-feedback-status";

const COPIED_FEEDBACK_MS = 2000;

/** Copies a plaintext value and shows "copied" or the failure for a moment. */
export function useCopyFeedback() {
  const [status, setStatus] = useState<CopyFeedbackStatus>(
    CopyFeedbackStatus.Idle,
  );
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setStatus(CopyFeedbackStatus.Copied);
    } catch {
      setStatus(CopyFeedbackStatus.Failed);
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(
      () => setStatus(CopyFeedbackStatus.Idle),
      COPIED_FEEDBACK_MS,
    );
  }

  return { status, copy };
}
