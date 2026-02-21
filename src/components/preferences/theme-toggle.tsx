"use client";

type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "invessiv_theme";

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

function getCurrentTheme(): Theme {
  const datasetTheme = document.documentElement.dataset.theme;
  if (datasetTheme === "light" || datasetTheme === "dark") {
    return datasetTheme;
  }

  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ThemeToggle(props: {
  label: string;
  lightLabel: string;
  darkLabel: string;
}) {
  return (
    <button
      type="button"
      aria-label={props.label}
      title={`${props.lightLabel} / ${props.darkLabel}`}
      onClick={() => {
        const current = getCurrentTheme();
        const next: Theme = current === "light" ? "dark" : "light";
        applyTheme(next);
      }}
      className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-xs font-extrabold text-[var(--color-foreground)] transition hover:-translate-y-[1px] hover:bg-[var(--color-surface)]"
    >
      {props.label}
    </button>
  );
}
