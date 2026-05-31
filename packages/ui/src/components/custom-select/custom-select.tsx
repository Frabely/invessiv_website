"use client";

import { type ReactNode, useState } from "react";
import styles from "./custom-select.module.css";

export type CustomSelectOption<TValue extends string = string> = {
  value: TValue;
  label: string;
  description?: string;
  ariaLabel?: string;
  leading?: ReactNode;
};

type CustomSelectProps<TValue extends string = string> = {
  describedBy?: string;
  id: string;
  invalid?: boolean;
  options: readonly CustomSelectOption<TValue>[];
  value: TValue;
  onChange: (next: TValue) => void;
};

export function CustomSelect<TValue extends string = string>({
  describedBy,
  id,
  invalid = false,
  options,
  value,
  onChange,
}: CustomSelectProps<TValue>) {
  const [isOpen, setIsOpen] = useState(false);
  const selected =
    options.find((option) => option.value === value) ?? options[0];
  const hasSelectedLeading = Boolean(selected?.leading);
  const listboxId = `${id}-listbox`;

  function selectValue(next: TValue) {
    onChange(next);
    setIsOpen(false);
  }

  return (
    <div
      className={styles.root}
      onBlur={(event) => {
        const nextTarget = event.relatedTarget as Node | null;
        if (!event.currentTarget.contains(nextTarget)) {
          setIsOpen(false);
        }
      }}
    >
      <button
        aria-controls={listboxId}
        aria-describedby={describedBy}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={styles.trigger}
        data-has-leading={hasSelectedLeading || undefined}
        data-invalid={invalid || undefined}
        id={id}
        onClick={() => setIsOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setIsOpen(false);
          }
        }}
        type="button"
      >
        {selected?.leading ? (
          <span className={styles.leading}>{selected.leading}</span>
        ) : null}
        <span className={styles.triggerText}>
          <span className={styles.triggerLabel}>{selected?.label}</span>
          {selected?.description ? (
            <span className={styles.triggerDescription}>
              {selected.description}
            </span>
          ) : null}
        </span>
        <span aria-hidden="true" className={styles.chevron}>
          v
        </span>
      </button>

      {isOpen ? (
        <div className={styles.listbox} id={listboxId} role="listbox">
          {options.map((option) => (
            <button
              aria-label={option.ariaLabel}
              aria-selected={value === option.value}
              className={styles.option}
              data-has-leading={Boolean(option.leading) || undefined}
              key={option.value}
              onClick={() => selectValue(option.value)}
              role="option"
              type="button"
            >
              {option.leading ? (
                <span className={styles.leading}>{option.leading}</span>
              ) : null}
              <span className={styles.optionText}>
                <span className={styles.optionLabel}>{option.label}</span>
                {option.description ? (
                  <span className={styles.optionDescription}>
                    {option.description}
                  </span>
                ) : null}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
