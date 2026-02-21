"use client";

import Link from "next/link";
import { trackCtaClick } from "@/lib/telemetry/client";

export function HomeCtaLinks(props: {
  primaryLabel: string;
  secondaryLabel: string;
}) {
  return (
    <div className="mt-8 flex flex-wrap gap-3">
      <Link
        href="/kontakt"
        className="rounded-full bg-[var(--color-primary)] px-5 py-3 font-semibold text-[var(--color-background)] transition hover:opacity-90"
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
        className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3 font-semibold text-[var(--color-foreground)] transition hover:bg-[var(--color-surface-muted)]"
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
