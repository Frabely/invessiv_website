"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "invessiv_theme";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") {
    return "light";
  }

  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function ThemeToggle(props: {
  label: string;
  lightLabel: string;
  darkLabel: string;
}) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return (
    <button
      type="button"
      aria-label={props.label}
      onClick={() => {
        setThemeState((prev) => (prev === "light" ? "dark" : "light"));
      }}
      className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-xs font-extrabold text-[var(--color-foreground)] transition hover:-translate-y-[1px] hover:bg-[var(--color-surface)]"
    >
      {theme === "light" ? props.lightLabel : props.darkLabel}
    </button>
  );
}
