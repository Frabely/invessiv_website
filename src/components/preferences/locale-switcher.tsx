"use client";

import { localeCookieName } from "@/config/i18n";

export function LocaleSwitcher(props: {
  label: string;
  deLabel: string;
  enLabel: string;
  activeLocale: "de" | "en";
}) {
  return (
    <label className="flex items-center gap-2 text-xs font-bold text-[var(--color-muted-foreground)]">
      <span>{props.label}</span>
      <select
        aria-label={props.label}
        defaultValue={props.activeLocale}
        onChange={(event) => {
          const nextLocale = event.target.value;
          document.cookie = `${localeCookieName}=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
          window.location.reload();
        }}
        className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-2 py-1.5 text-xs font-extrabold text-[var(--color-foreground)] outline-none ring-[var(--accent)] transition focus:ring-2"
      >
        <option value="de">{props.deLabel}</option>
        <option value="en">{props.enLabel}</option>
      </select>
    </label>
  );
}
