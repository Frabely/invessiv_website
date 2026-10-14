"use client";

import { useRef } from "react";

/** Focuses the first invalid control after React has rendered validation messages. */
export function useFocusFirstInvalidField() {
  const formRef = useRef<HTMLFormElement>(null);

  function focusFirstInvalidField() {
    requestAnimationFrame(() =>
      formRef.current
        ?.querySelector<HTMLElement>(
          '[aria-invalid="true"], button[data-invalid="true"], fieldset[data-invalid="true"] input:not(:disabled)',
        )
        ?.focus(),
    );
  }

  return { formRef, focusFirstInvalidField };
}
