"use client";

import { type KeyboardEvent, useRef } from "react";
import styles from "./segmented-control.module.css";

export type SegmentedControlProps<Value extends string> = {
  activeValue: Value;
  ariaLabel: string;
  className?: string;
  disabled?: boolean;
  items: readonly { value: Value; label: string }[];
  onSelectAction: (value: Value) => void;
};

/**
 * Picks one of a few views of the same content, such as a filter. Unlike `TabList` it controls no
 * panel of its own, so it is a radio group: arrow keys move and select, Tab leaves it.
 */
export function SegmentedControl<Value extends string>({
  activeValue,
  ariaLabel,
  className,
  disabled = false,
  items,
  onSelectAction,
}: SegmentedControlProps<Value>) {
  const segmentRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.value === activeValue),
  );

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (disabled || items.length < 2) return;
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown")
      nextIndex = (activeIndex + 1) % items.length;
    if (event.key === "ArrowLeft" || event.key === "ArrowUp")
      nextIndex = (activeIndex - 1 + items.length) % items.length;
    if (nextIndex === null) return;
    event.preventDefault();
    const next = items[nextIndex];
    if (!next) return;
    onSelectAction(next.value);
    segmentRefs.current[nextIndex]?.focus();
  }

  return (
    <div
      aria-label={ariaLabel}
      className={className ? `${styles.group} ${className}` : styles.group}
      role="radiogroup"
    >
      {items.map((item, index) => {
        const checked = index === activeIndex;
        return (
          <button
            aria-checked={checked}
            className={styles.segment}
            disabled={disabled}
            key={item.value}
            onClick={() => onSelectAction(item.value)}
            onKeyDown={handleKeyDown}
            ref={(element) => {
              segmentRefs.current[index] = element;
            }}
            role="radio"
            tabIndex={checked ? 0 : -1}
            title={item.label}
            type="button"
          >
            <span className={styles.label}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
