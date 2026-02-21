import Link from "next/link";

export function TemplateProductsSection(props: {
  heading: string;
  ctaLabel: string;
  products: Array<{
    title: string;
    price: string;
    format: string;
  }>;
}) {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-20 pt-10">
      <h2 className="text-2xl font-black tracking-tight text-[var(--color-foreground)] sm:text-3xl">
        {props.heading}
      </h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {props.products.map((item) => (
          <article
            key={item.title}
            className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
              {item.format}
            </p>
            <h3 className="mt-2 text-lg font-black text-[var(--color-foreground)]">
              {item.title}
            </h3>
            <p className="mt-4 text-sm font-semibold text-[var(--color-foreground)]">
              {item.price}
            </p>
            <Link
              href="/kontakt"
              className="mt-5 inline-flex rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-foreground)] transition hover:bg-[var(--color-surface-muted)]"
            >
              {props.ctaLabel}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
