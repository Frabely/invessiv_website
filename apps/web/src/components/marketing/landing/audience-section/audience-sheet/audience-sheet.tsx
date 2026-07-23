import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type {
  PointerEvent as ReactPointerEvent,
  ReactNode,
  RefObject,
} from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useModalDialog } from "@/hooks/marketing/use-modal-dialog";
import styles from "./audience-sheet.module.css";

/** Drag distance past which releasing dismisses the sheet. */
const DISMISS_DISTANCE_PX = 110;
/** A quick flick dismisses even when it stayed short, in px per millisecond. */
const DISMISS_VELOCITY = 0.55;

type AudienceSheetProps = {
  children: ReactNode;
  closeLabel: string;
  labelledById: string;
  onClose: () => void;
  open: boolean;
  /** Receives focus once the sheet closes, usually the pill that opened it. */
  returnFocusRef?: RefObject<HTMLElement | null>;
};

export function AudienceSheet({
  children,
  closeLabel,
  labelledById,
  onClose,
  open,
  returnFocusRef,
}: AudienceSheetProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const dragStartRef = useRef<{ time: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  useModalDialog({
    dialogRef,
    initialFocusRef: closeButtonRef,
    onClose,
    open,
    returnFocusRef,
  });

  const setDragOffset = useCallback((offset: number) => {
    dialogRef.current?.style.setProperty("--sheet-drag", `${offset}px`);
  }, []);

  useEffect(() => {
    if (open) {
      setDragOffset(0);
    }
  }, [open, setDragOffset]);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      dragStartRef.current = { time: performance.now(), y: event.clientY };
      event.currentTarget.setPointerCapture?.(event.pointerId);
      setDragging(true);
    },
    [],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const start = dragStartRef.current;
      if (!start) {
        return;
      }
      setDragOffset(Math.max(0, event.clientY - start.y));
    },
    [setDragOffset],
  );

  const endDrag = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const start = dragStartRef.current;
      dragStartRef.current = null;
      setDragging(false);

      if (!start) {
        return;
      }

      const distance = Math.max(0, event.clientY - start.y);
      const velocity = distance / Math.max(1, performance.now() - start.time);

      if (distance > DISMISS_DISTANCE_PX || velocity > DISMISS_VELOCITY) {
        onClose();
        return;
      }

      setDragOffset(0);
    },
    [onClose, setDragOffset],
  );

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className={styles.backdrop} onClick={onClose}>
      <div
        aria-labelledby={labelledById}
        aria-modal="true"
        className={styles.sheet}
        data-dragging={dragging ? "true" : undefined}
        onClick={(event) => {
          event.stopPropagation();
        }}
        ref={dialogRef}
        role="dialog"
      >
        <div
          aria-hidden="true"
          className={styles.handle}
          onPointerCancel={endDrag}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
        >
          <span className={styles.grabber} />
        </div>

        <button
          aria-label={closeLabel}
          className={styles.close}
          onClick={onClose}
          ref={closeButtonRef}
          type="button"
        >
          <FontAwesomeIcon aria-hidden="true" icon={faXmark} />
        </button>

        <div className={styles.content}>{children}</div>
      </div>
    </div>,
    document.body,
  );
}
