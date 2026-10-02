"use client";

import { type ReactNode, useEffect, useRef } from "react";
import {
  faArrowDown,
  faArrowUp,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  moveListItem,
  removeListItem,
} from "@invessiv/common/patterns/collections/ordered-list";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { ButtonControl } from "@invessiv/ui";
import styles from "./ordered-block-list-editor.module.css";

type OrderedBlockListItem = {
  id: string;
  name: string;
  /** Extra line under the name, such as the key or an archived badge. */
  detail?: ReactNode;
};

type OrderedBlockListEditorLabels = {
  moveUp: string;
  moveDown: string;
  remove: string;
  moved: string;
  removed: string;
};

export type OrderedBlockListEditorProps = {
  disabled?: boolean;
  empty: ReactNode;
  items: readonly OrderedBlockListItem[];
  labels: OrderedBlockListEditorLabels;
  onChangeAction: (ids: string[]) => void;
  /** Receives what a screen reader should hear; the owner renders one live region for all changes. */
  onAnnounceAction: (message: string) => void;
  /** Shows the order only: without the right to change it the controls are absent, not disabled. */
  readOnly?: boolean;
};

/**
 * An ordered list of blocks with up, down and remove, the same controls and announcements as the
 * process step editor. It knows neither templates nor forms; Task 65 reuses it for a form.
 */
export function OrderedBlockListEditor({
  disabled = false,
  empty,
  items,
  labels,
  onAnnounceAction,
  onChangeAction,
  readOnly = false,
}: OrderedBlockListEditorProps) {
  const listRef = useRef<HTMLOListElement>(null);
  const pendingFocusRef = useRef<{ index: number; control: string } | null>(
    null,
  );
  const ids = items.map((item) => item.id);

  // Runs after every render: a change re-renders the rows, then focus follows the affected row.
  useEffect(() => {
    const pending = pendingFocusRef.current;
    if (!pending) return;
    pendingFocusRef.current = null;
    const rows = listRef.current?.children;
    const row = rows?.[Math.min(pending.index, (rows?.length ?? 1) - 1)];
    const buttons = [
      ...(row?.querySelectorAll<HTMLButtonElement>("button[data-control]") ??
        []),
    ].filter((button) => !button.disabled);
    (
      buttons.find((button) => button.dataset.control === pending.control) ??
      buttons[0]
    )?.focus();
  });

  function move(index: number, direction: -1 | 1) {
    const item = items[index];
    if (!item) return;
    onChangeAction(moveListItem(ids, index, direction));
    onAnnounceAction(
      formatMessage(labels.moved, {
        name: item.name,
        position: index + direction + 1,
      }),
    );
    pendingFocusRef.current = {
      index: index + direction,
      control: direction === -1 ? "up" : "down",
    };
  }

  function remove(index: number) {
    const item = items[index];
    if (!item) return;
    onChangeAction(removeListItem(ids, index));
    onAnnounceAction(formatMessage(labels.removed, { name: item.name }));
    pendingFocusRef.current = { index, control: "remove" };
  }

  return (
    <div className={styles.editor}>
      {items.length === 0 ? (
        empty
      ) : (
        <ol className={styles.rows} ref={listRef}>
          {items.map((item, index) => {
            const upLabel = formatMessage(labels.moveUp, { name: item.name });
            const downLabel = formatMessage(labels.moveDown, {
              name: item.name,
            });
            const removeLabel = formatMessage(labels.remove, {
              name: item.name,
            });
            return (
              <li className={styles.row} key={item.id}>
                <span aria-hidden="true" className={styles.position}>
                  {index + 1}
                </span>
                <span className={styles.body}>
                  <span className={styles.name}>{item.name}</span>
                  {item.detail ? (
                    <span className={styles.detail}>{item.detail}</span>
                  ) : null}
                </span>
                {readOnly ? null : (
                  <span className={styles.actions}>
                    <ButtonControl
                      aria-label={upLabel}
                      className={styles.iconButton}
                      data-control="up"
                      disabled={disabled || index === 0}
                      onClick={() => move(index, -1)}
                      title={upLabel}
                      type="button"
                      variant="ghost"
                    >
                      <FontAwesomeIcon aria-hidden="true" icon={faArrowUp} />
                    </ButtonControl>
                    <ButtonControl
                      aria-label={downLabel}
                      className={styles.iconButton}
                      data-control="down"
                      disabled={disabled || index === items.length - 1}
                      onClick={() => move(index, 1)}
                      title={downLabel}
                      type="button"
                      variant="ghost"
                    >
                      <FontAwesomeIcon aria-hidden="true" icon={faArrowDown} />
                    </ButtonControl>
                    <ButtonControl
                      aria-label={removeLabel}
                      className={styles.iconButton}
                      data-control="remove"
                      disabled={disabled}
                      onClick={() => remove(index)}
                      title={removeLabel}
                      type="button"
                      variant="ghost"
                    >
                      <FontAwesomeIcon aria-hidden="true" icon={faXmark} />
                    </ButtonControl>
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
