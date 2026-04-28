"use client";

import { useState, type FormEvent } from "react";

import styles from "./hero-quick-entry.module.css";

const HERO_PROMPT_STORAGE_KEY = "invessiv:landing:hero-prompt";

type HeroQuickEntryProps = {
  placeholder: string;
  submitAriaLabel: string;
  targetHref: string;
};

export function HeroQuickEntry({
  placeholder,
  submitAriaLabel,
  targetHref,
}: HeroQuickEntryProps) {
  const [value, setValue] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = value.trim();
    if (typeof window !== "undefined" && trimmed) {
      window.sessionStorage.setItem(HERO_PROMPT_STORAGE_KEY, trimmed);
    }
    if (typeof window !== "undefined") {
      const targetId = targetHref.startsWith("#")
        ? targetHref.slice(1)
        : targetHref;
      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      window.location.hash = targetHref;
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <input
        className={styles.input}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        type="text"
        value={value}
      />
      <button
        aria-label={submitAriaLabel}
        className={styles.submit}
        type="submit"
      >
        <svg
          aria-hidden="true"
          fill="none"
          height="18"
          viewBox="0 0 24 24"
          width="18"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5 12h14M13 6l6 6-6 6"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
      </button>
    </form>
  );
}
