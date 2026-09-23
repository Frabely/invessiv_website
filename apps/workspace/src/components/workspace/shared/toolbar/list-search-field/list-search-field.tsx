"use client";

import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import styles from "./list-search-field.module.css";

type ListSearchFieldProps = {
  currentValue: string;
  label: string;
  onCommitAction: (value: string | undefined) => void;
  placeholder: string;
};

const SEARCH_DEBOUNCE_MS = 250;

export function ListSearchField({
  currentValue,
  label,
  onCommitAction,
  placeholder,
}: ListSearchFieldProps) {
  const [searchValue, setSearchValue] = useState(currentValue);
  // Callers pass a function that is new on every render. Keeping it out of the effect's
  // dependencies stops each parent render from restarting the debounce timer.
  const commitRef = useRef(onCommitAction);

  useEffect(() => {
    commitRef.current = onCommitAction;
  }, [onCommitAction]);

  useEffect(() => {
    setSearchValue(currentValue);
  }, [currentValue]);

  useEffect(() => {
    if (searchValue === currentValue) {
      return;
    }

    const timeout = window.setTimeout(() => {
      const trimmed = searchValue.trim();
      const committedValue = trimmed ? trimmed : undefined;
      commitRef.current(committedValue);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [currentValue, searchValue]);

  return (
    <label className={styles.searchField}>
      <span className={styles.fieldLabel}>{label}</span>
      <span className={styles.searchInputWrap}>
        <span aria-hidden="true" className={styles.searchIcon}>
          <FontAwesomeIcon icon={faMagnifyingGlass} />
        </span>
        <input
          aria-label={label}
          className={styles.searchInput}
          onChange={(event) => {
            setSearchValue(event.target.value);
          }}
          placeholder={placeholder}
          type="search"
          value={searchValue}
        />
      </span>
    </label>
  );
}
