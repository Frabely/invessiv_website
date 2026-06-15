"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import styles from "./lead-search-field.module.css";

type LeadSearchFieldProps = {
  currentValue: string;
  label: string;
  onCommitAction: (value: string | undefined) => void;
  placeholder: string;
};

const SEARCH_DEBOUNCE_MS = 250;

export function LeadSearchField({
  currentValue,
  label,
  onCommitAction,
  placeholder,
}: LeadSearchFieldProps) {
  const [searchValue, setSearchValue] = useState(currentValue);

  useEffect(() => {
    setSearchValue(currentValue);
  }, [currentValue]);

  useEffect(() => {
    if (searchValue === currentValue) {
      return;
    }

    const timeout = window.setTimeout(() => {
      const trimmed = searchValue.trim();
      onCommitAction(trimmed ? trimmed : undefined);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [currentValue, onCommitAction, searchValue]);

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
