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
        className="mock-btn-primary rounded-full px-4 py-2.5 text-sm font-extrabold transition hover:-translate-y-[1px]"
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
        className="mock-btn-soft rounded-full px-4 py-2.5 text-sm font-extrabold transition hover:-translate-y-[1px] hover:bg-[var(--color-surface)]"
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
