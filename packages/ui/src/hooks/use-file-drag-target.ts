"use client";

import { type DragEvent, useRef, useState } from "react";

function carriesFiles(event: DragEvent<HTMLElement>): boolean {
  return Array.from(event.dataTransfer?.types ?? []).includes("Files");
}

/**
 * Tracks whether files are dragged over an element. Child elements fire their own enter/leave
 * events, so a counter decides when the pointer really left the target.
 */
export function useFileDragTarget(
  onFilesDroppedAction: (files: File[]) => void,
  disabled = false,
) {
  const [active, setActive] = useState(false);
  const depthRef = useRef(0);

  function reset() {
    depthRef.current = 0;
    setActive(false);
  }

  return {
    active: active && !disabled,
    handlers: {
      onDragEnter(event: DragEvent<HTMLElement>) {
        if (disabled || !carriesFiles(event)) return;
        event.preventDefault();
        depthRef.current += 1;
        setActive(true);
      },
      onDragOver(event: DragEvent<HTMLElement>) {
        if (disabled || !carriesFiles(event)) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
      },
      onDragLeave(event: DragEvent<HTMLElement>) {
        if (disabled || !carriesFiles(event)) return;
        event.preventDefault();
        depthRef.current = Math.max(0, depthRef.current - 1);
        if (depthRef.current === 0) setActive(false);
      },
      onDrop(event: DragEvent<HTMLElement>) {
        if (disabled || !carriesFiles(event)) return;
        // A nested drop target already took these files; an outer one only resets its state.
        if (event.defaultPrevented) {
          reset();
          return;
        }
        event.preventDefault();
        reset();
        const files = Array.from(event.dataTransfer.files ?? []);
        if (files.length > 0) onFilesDroppedAction(files);
      },
    },
  };
}
