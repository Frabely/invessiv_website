"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  faCloudArrowUp,
  faFolderOpen,
  faPaperclip,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ButtonControl } from "@invessiv/ui";
import type { ChatAttachmentTexts } from "@/common/contracts/files/chat-attachment-texts";
import styles from "./chat-attachment-menu.module.css";

export type ChatAttachmentMenuProps = {
  canPick: boolean;
  canUpload: boolean;
  /** True once the message carries the maximum number of attachments. */
  limitReached: boolean;
  labels: Pick<
    ChatAttachmentTexts,
    "attach" | "limitReached" | "pick" | "upload"
  >;
  onPickAction: () => void;
  onUploadAction: () => void;
};

/** 📎 in the composer: one action opens directly, two open a small disclosure. */
export function ChatAttachmentMenu({
  canPick,
  canUpload,
  limitReached,
  labels,
  onPickAction,
  onUploadAction,
}: ChatAttachmentMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const both = canPick && canUpload;

  useEffect(() => {
    if (!open) return;

    function closeOnOutside(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    }

    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  if (!canPick && !canUpload) return null;

  function choose(action: () => void) {
    setOpen(false);
    action();
  }

  function handleTrigger() {
    if (both) setOpen((current) => !current);
    else if (canUpload) onUploadAction();
    else onPickAction();
  }

  return (
    <div className={styles.menu} ref={rootRef}>
      <ButtonControl
        aria-controls={both ? menuId : undefined}
        aria-expanded={both ? open : undefined}
        aria-label={labels.attach}
        className={styles.trigger}
        disabled={limitReached}
        onClick={handleTrigger}
        ref={triggerRef}
        title={limitReached ? labels.limitReached : labels.attach}
        type="button"
        variant="ghost"
      >
        <FontAwesomeIcon aria-hidden="true" icon={faPaperclip} />
      </ButtonControl>
      {both && open ? (
        <ul className={styles.options} id={menuId}>
          <li>
            <ButtonControl
              className={styles.option}
              onClick={() => choose(onUploadAction)}
              type="button"
              variant="ghost"
            >
              <FontAwesomeIcon aria-hidden="true" icon={faCloudArrowUp} />
              {labels.upload}
            </ButtonControl>
          </li>
          <li>
            <ButtonControl
              className={styles.option}
              onClick={() => choose(onPickAction)}
              type="button"
              variant="ghost"
            >
              <FontAwesomeIcon aria-hidden="true" icon={faFolderOpen} />
              {labels.pick}
            </ButtonControl>
          </li>
        </ul>
      ) : null}
    </div>
  );
}
