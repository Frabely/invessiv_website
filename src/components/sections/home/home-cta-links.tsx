"use client";

import Link from "next/link";
import { trackCtaClick } from "@/lib/telemetry/client";

export function HomeCtaLinks(props: {
  primaryLabel: string;
  secondaryLabel: string;
}) {
  return (
    <div className="mt-4 flex flex-wrap gap-2.5">
      <Link
        href="/kontakt"
        className="rounded-xl border border-[color:rgba(20,184,166,0.55)] bg-[linear-gradient(140deg,rgba(20,184,166,0.35),rgba(15,118,110,0.42))] px-4 py-2.5 text-sm font-extrabold text-[var(--color-foreground)] transition hover:-translate-y-[1px]"
        onClick={() =>
          trackCtaClick({
            kind: "primary",
            placement: "home_hero",
            target: "/kontakt",
          })
        }
      >
        {props.primaryLabel}
      </Link>
      <Link
        href="/vorlagen"
        className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-2.5 text-sm font-extrabold text-[var(--color-foreground)] transition hover:-translate-y-[1px] hover:bg-[var(--color-surface)]"
        onClick={() =>
          trackCtaClick({
            kind: "secondary",
            placement: "home_hero",
            target: "/vorlagen",
          })
        }
      >
        {props.secondaryLabel}
      </Link>
    </div>
  );
}
