"use client";

import { type KeyboardEvent, type ReactNode, useRef } from "react";

import styles from "./tab-list.module.css";

type TabListProps<Value extends string> = {
  activeValue: Value;
  ariaLabel: string;
  className?: string;
  items: readonly {
    value: Value;
    id: string;
    panelId: string;
    label: ReactNode;
    accessibleName?: string;
    descriptionId?: string;
    invalid?: boolean;
    title?: string;
  }[];
  onSelectAction: (value: Value) => void;
  tabClassName?: string;
};

export function TabList<Value extends string>({
  activeValue,
  ariaLabel,
  className,
  items,
  onSelectAction,
  tabClassName,
}: TabListProps<Value>) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.value === activeValue),
  );

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (items.length < 2) return;
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight")
      nextIndex = (activeIndex + 1) % items.length;
    if (event.key === "ArrowLeft")
      nextIndex = (activeIndex - 1 + items.length) % items.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = items.length - 1;
    if (nextIndex === null) return;
    event.preventDefault();
    const next = items[nextIndex];
    if (!next) return;
    onSelectAction(next.value);
    tabRefs.current[nextIndex]?.focus();
  }

  return (
    <div
      aria-label={ariaLabel}
      className={className ?? styles.list}
      role="tablist"
    >
      {items.map((item, index) => {
        const selected = index === activeIndex;
        return (
          <button
            aria-controls={item.panelId}
            aria-describedby={item.descriptionId}
            aria-label={item.accessibleName}
            aria-selected={selected}
            className={tabClassName ?? styles.tab}
            data-invalid={item.invalid || undefined}
            id={item.id}
            key={item.value}
            onClick={() => onSelectAction(item.value)}
            onKeyDown={handleKeyDown}
            ref={(element) => {
              tabRefs.current[index] = element;
            }}
            role="tab"
            tabIndex={selected ? 0 : -1}
            title={item.title}
            type="button"
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
