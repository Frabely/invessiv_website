import Link from "next/link";

export function ServicePackagesSection(props: {
  heading: string;
  ctaLabel: string;
  packages: Array<{
    name: string;
    priceFrom: string;
    summary: string;
    bullets: string[];
  }>;
}) {
  return (
    <section className="mx-auto w-full max-w-[1080px] px-4 pb-8 pt-4">
      <h2 className="text-2xl font-black tracking-tight text-[var(--color-foreground)] sm:text-3xl">
        {props.heading}
      </h2>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        {props.packages.map((item) => (
          <article
            key={item.name}
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
          >
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-muted-foreground)]">
              {item.priceFrom}
            </p>
            <h3 className="mt-2 text-xl font-black text-[var(--color-foreground)]">
              {item.name}
            </h3>
            <p className="mt-3 text-sm leading-6 text-[var(--color-muted-foreground)]">
              {item.summary}
            </p>
            <ul className="mt-4 space-y-2 text-sm text-[var(--color-foreground)]">
              {item.bullets.map((bullet) => (
                <li key={bullet}>- {bullet}</li>
              ))}
            </ul>
            <Link
              href="/kontakt"
              className="mt-4 inline-flex rounded-xl border border-[color:rgba(20,184,166,0.55)] bg-[linear-gradient(140deg,rgba(20,184,166,0.35),rgba(15,118,110,0.42))] px-3.5 py-2 text-sm font-extrabold text-[var(--color-foreground)] transition hover:-translate-y-[1px]"
            >
              {props.ctaLabel}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
